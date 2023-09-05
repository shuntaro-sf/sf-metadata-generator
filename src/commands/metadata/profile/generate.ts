/* eslint-disable guard-for-in */
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as ConfigData from '../../../';

export type Results = { [key: string]: string };
export type DefaultValues = { [key: string]: any | DefaultValues };
export type IsRequired = { [key: string]: any | IsRequired };
export type Options = { [key: string]: any | Options };
export type ActionOverrides = { [key: string]: any | ActionOverrides };
export type MetaSettings = { [key: string]: any | MetaSettings };
export type PermissionTags = { [key: string]: any | PermissionTags };

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-metadata-generator', 'profile.generate');

export type ProfileGenerateResult = {
  metaStr: string;
};

export default class Generate extends SfCommand<ProfileGenerateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    input: Flags.string({
      char: 'i',
      summary: messages.getMessage('flags.input.summary'),
    }),
    outputdir: Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.outputdir.summary'),
      default: './',
    }),
    source: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.source.summary'),
    }),
    delimiter: Flags.string({
      char: 'd',
      summary: messages.getMessage('flags.delimiter.summary'),
      default: ConfigData.profileGenerateConfig.delimiter,
    }),
  };

  private static delimiter = ConfigData.profileGenerateConfig.delimiter;
  private static permissionTags = ConfigData.profileGenerateConfig.permissionTags as PermissionTags;
  private static options = ConfigData.profileGenerateConfig.options as Options;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static permissionMetaStrs = {} as { [key: string]: string };

  public async run(): Promise<ProfileGenerateResult> {
    const { flags } = await this.parse(Generate);
    if (flags.input === undefined || !existsSync(flags.input)) {
      throw new SfError(messages.getMessage('error.path.input') + flags.input);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    if (flags.source === undefined || !existsSync(flags.source)) {
      throw new SfError(messages.getMessage('error.path.source') + flags.source);
    }
    if (flags.delimiter === undefined) {
      flags.delimiter = Generate.delimiter;
    }
    const csv = readFileSync(flags.input, {
      encoding: 'utf8',
    })
      .toString()
      .split('\n')
      .map((e) => e.trim())
      .map((e) => e.split(',').map((elm) => elm.trim()));

    const header = csv[0];
    let metaStr = readFileSync(flags.source, { encoding: 'utf8' });

    for (let rowIndex = 1; rowIndex < csv.length; rowIndex++) {
      if (csv[rowIndex].length < header.length) {
        continue;
      }

      // generates metadata for each row
      metaStr = this.getMetaStr(metaStr, csv, rowIndex, header);
    }
    if (Generate.validationResults.length > 0) {
      this.showValidationErrorMessages();
    } else {
      this.saveMetaData(metaStr, flags);
    }

    return { metaStr };
  }

  private getMetaStr(metastr: string, csv: string[][], rowIndex: number, header: string[]): string {
    const row = csv[rowIndex];
    const indexOfFullName = header.indexOf('fullName');
    const indexOfType = header.indexOf('type');

    const fullName = row[indexOfFullName];
    const type = row[indexOfType];

    for (const tag of Generate.permissionTags[type]['tags']) {
      const indexOfTag = header.indexOf(String(tag));
      const keyTag = Generate.permissionTags[type]['keyTag'];

      // dose not include tag at the header
      if (indexOfTag === -1) {
        continue;
      }

      // validates inputs
      if (!this.isValidInputs(String(tag), row, header, rowIndex)) {
        continue;
      }

      if (Generate.permissionTags[type][tag] === null) {
        continue;
      }

      if (!Generate.permissionMetaStrs[fullName]) {
        this.extractMetaStrsForEachKeyTag(metastr, type, String(keyTag));
      }

      row[indexOfTag] = this.convertSpecialChars(row[indexOfTag]);
      this.formatBoolean(String(tag), row, indexOfTag);

      const permissionStr = '<' + tag + '>' + row[indexOfTag] + '</' + tag + '>';
      const permissionRegexp = new RegExp('<' + tag + '>(.+)<\\/' + tag + '>');
      const newPermMetaStr = Generate.permissionMetaStrs[fullName].replace(permissionRegexp, permissionStr);
      metastr = metastr.replace(Generate.permissionMetaStrs[fullName], newPermMetaStr);
      Generate.permissionMetaStrs[fullName] = newPermMetaStr;
    }
    return metastr;
  }

  private extractMetaStrsForEachKeyTag(metastr: string, type: string, keyTag: string): void {
    const regexp = new RegExp('<' + type + '>');
    const tagMetastrs = metastr.split(regexp);

    for (const tagMetastr of tagMetastrs) {
      const keyTagRegexp = new RegExp('<' + keyTag + '>(.+)*' + '\\</' + keyTag + '>');
      const fullNameValue = tagMetastr.match(keyTagRegexp);
      if (fullNameValue === null) {
        continue;
      }
      Generate.permissionMetaStrs[fullNameValue[1]] = tagMetastr;
    }
  }

  private formatBoolean(tag: string, row: string[], indexOfTag: number): void {
    if (Generate.options[tag] !== undefined) {
      if (Generate.options[tag].includes(true.toString()) && Generate.options[tag].includes(false.toString())) {
        row[indexOfTag] = row[indexOfTag].toLowerCase();
      }
    }
  }

  private isValidInputs(tag: string, row: string[], header: string[], rowIndex: number): boolean {
    const indexOfType = header.indexOf('type');
    const type = row[indexOfType];
    const indexOfTag = header.indexOf(tag);

    const validationResLenBefore = Generate.validationResults.length;
    const errorIndex = 'Row' + (rowIndex + 1) + 'Col' + (indexOfTag + 1);

    switch (tag) {
      case 'editable':
        this.validatesEditable(type, row, indexOfTag, errorIndex);
        break;
      case 'readable':
        this.validatesReadable(type, row, indexOfTag, errorIndex);
        break;
      case 'allowCreate':
        this.validatesAllowCreate(type, row, indexOfTag, errorIndex);
        break;
      case 'allowDelete':
        this.validatesAllowDelete(type, row, indexOfTag, errorIndex);
        break;
      case 'allowEdit':
        this.validatesAllowEdit(type, row, indexOfTag, errorIndex);
        break;
      case 'allowRead':
        this.validatesAllowRead(type, row, indexOfTag, errorIndex);
        break;
      case 'modifyAllRecords':
        this.validatesModiryAllRecords(type, row, indexOfTag, errorIndex);
        break;
      case 'viewAllRecords':
        this.validatesViewAllRecords(type, row, indexOfTag, errorIndex);
        break;
      case 'default':
        this.validatesDefault(type, row, indexOfTag, errorIndex);
        break;
      case 'visible':
        this.validatesVisible(type, row, indexOfTag, errorIndex);
        break;
      case 'enabled':
        this.validatesEnable(type, row, indexOfTag, errorIndex);
        break;
      case 'visibility':
        this.validatesVisibility(type, row, indexOfTag, errorIndex);
        break;
    }
    return validationResLenBefore === Generate.validationResults.length;
  }

  private validatesVisibility(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'tabVisibilities') {
      if (!Generate.options.visibility.includes(row[indexOfTag]) && row[indexOfTag] !== '') {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.visibility.options') + Generate.options.visibility.toString()
        );
      }
    }
  }

  private validatesEnable(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'classAccesses' || type === 'userPermissions' || type === 'pageAccesses') {
      if (!Generate.options.enabled.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.enabled.options'));
      }
    }
  }

  private validatesVisible(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'permissionTags' || type === 'recordTypeVisibilities' || type === 'applicationVisibilities') {
      if (!Generate.options.visible.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visible.options'));
      }
    }
  }

  private validatesDefault(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'permissionTags' || type === 'recordTypeVisibilities' || type === 'applicationVisibilities') {
      if (!Generate.options.default.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.default.options'));
      }
    }
  }

  private validatesViewAllRecords(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'objectPermissions') {
      if (!Generate.options.viewAllRecords.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.viewallrecords.options'));
      }
    }
  }

  private validatesModiryAllRecords(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'objectPermissions') {
      if (!Generate.options.modifyAllRecords.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.modifyallrecords.options'));
      }
    }
  }

  private validatesAllowRead(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'objectPermissions') {
      if (!Generate.options.allowRead.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.allowread.options'));
      }
    }
  }

  private validatesAllowEdit(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'objectPermissions') {
      if (!Generate.options.allowEdit.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.allowedit.options'));
      }
    }
  }

  private validatesAllowDelete(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'objectPermissions') {
      if (!Generate.options.allowDelete.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.allowdelete.options'));
      }
    }
  }

  private validatesAllowCreate(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'objectPermissions') {
      if (!Generate.options.allowCreate.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.allowcreate.options'));
      }
    }
  }

  private validatesReadable(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'fieldPermissions') {
      if (!Generate.options.readable.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.readable.options'));
      }
    }
  }

  private validatesEditable(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'fieldPermissions') {
      if (!Generate.options.editable.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.editable.options'));
      }
    }
  }

  private pushValidationResult(index: string, errorMessage: string): void {
    Generate.validationResults.push({ INDEX: index, PROBLEM: errorMessage });
  }

  private convertSpecialChars(str: string): string {
    str = str.replace(/&/g, '&' + 'amp;');
    str = str.replace(/</g, '&' + 'lt;');
    str = str.replace(/>/g, '&' + 'gt;');
    str = str.replace(/"/g, '&' + 'quot;');
    str = str.replace(/'/g, '&' + '#x27;');
    str = str.replace(/`/g, '&' + '#x60;');
    return str;
  }

  private saveMetaData(
    metastr: string,
    flags: { input: string | undefined; outputdir: string; source: string | undefined; delimiter: string } & {
      [flag: string]: any;
    } & { json: boolean | undefined }
  ): void {
    const blue = '\u001b[34m';
    const white = '\u001b[37m';
    console.log('===' + blue + ' Generated Source' + white);
    if (flags.source === undefined) {
      return;
    }
    const dirsToSource = flags.source.split('/');
    if (!existsSync(join(flags.outputdir, dirsToSource[dirsToSource.length - 1]))) {
      writeFileSync(join(flags.outputdir, dirsToSource[dirsToSource.length - 1]), metastr, 'utf8');
    }
    console.log(
      'Successfully saved ' +
        dirsToSource[dirsToSource.length - 1] +
        ' in ' +
        join(flags.outputdir, dirsToSource[dirsToSource.length - 1])
    );
  }

  private showValidationErrorMessages(): void {
    const logLengths = this.getLogLenghts(Generate.validationResults);
    this.showLogHeader(logLengths);
    this.showLogBody(Generate.validationResults, logLengths);
    throw new SfError(messages.getMessage('validation'));
  }

  private getLogLenghts(logs: Array<{ [key: string]: string }>): { [key: string]: number } {
    const logLengths = {} as { [key: string]: number };
    for (const log of logs) {
      for (const logName in log) {
        if (logLengths[logName] < log[logName].length || logLengths[logName] === undefined) {
          logLengths[logName] = log[logName].length;
        }
      }
    }
    return logLengths;
  }

  private showLogHeader(logLengths: any): void {
    let header = '';
    let line = '';
    const whiteSpace = ' ';
    const lineChar = '─';

    let counter = 0;
    for (const logName in logLengths) {
      counter++;
      header += logName;
      if (counter < Object.keys(String(logLengths)).length) {
        header += whiteSpace.repeat(logLengths[logName] - logName.length) + '\t';
      }
      line += lineChar.repeat(Number(logLengths[logName])) + '\t';
    }
    console.log(header);
    console.log(line);
  }

  private showLogBody(logs: any[], logLengths: any): void {
    const whiteSpace = ' ';
    for (const log of logs) {
      let logMessage = '';
      let counter = 0;
      for (const logName in log) {
        counter++;
        logMessage += log[logName];
        if (counter < Object.keys(String(log)).length) {
          logMessage += whiteSpace.repeat(logLengths[logName] - log[logName].length) + '\t';
        }
      }
      console.log(logMessage);
    }
  }
}
