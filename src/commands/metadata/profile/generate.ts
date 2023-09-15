/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable guard-for-in */
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, parse } from 'path';
import csvtojson from 'csvtojson';
import xml2js from 'xml2js';
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
export type MetaJson = { [key: string]: any | MetaJson };

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'profile.generate');

export type ProfileGenerateResult = {
  MetaJson: MetaJson;
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

  private static xmlSetting = ConfigData.objectGenerateConfig.xmlSetting as { [key: string]: string };
  private static delimiter = ConfigData.profileGenerateConfig.delimiter;
  private static permissionTags = ConfigData.profileGenerateConfig.permissionTags as PermissionTags;
  private static options = ConfigData.profileGenerateConfig.options as Options;
  private static indentationLength = ConfigData.profileGenerateConfig.indentationLength;
  private static profileExtension = ConfigData.profileGenerateConfig.profileExtension;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static metaXmls = {} as { [key: string]: string };
  private static metaJson = {} as { [key: string]: any };

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

    const parser = new xml2js.Parser();

    const metaXml = readFileSync(flags.source, { encoding: 'utf8' });

    const fullName = this.getFullNameFromPath(flags.source);
    if (fullName === '') {
      throw new SfError(messages.getMessage('error.source.extension'));
    }

    parser.parseString(metaXml, (err, metaJson) => {
      if (err) {
        console.log(err.message);
      } else {
        if (!Object.keys(metaJson).includes('Profile')) {
          return;
        }
        Generate.metaJson = metaJson;
      }
    });
    console.log(Generate.metaJson);
    const csvJson = await csvtojson().fromFile(flags.input);

    csvJson.forEach((row, rowIndex) => {
      console.log(row.type);
      const metaItem = Generate.metaJson.Profile[row.type].filter(
        (elm: { [x: string]: any[] }) => row.fullName === elm[Generate.permissionTags[row.type].keyTag][0]
      )[0];
      Generate.permissionTags[row.type].tags.forEach((tag: string) => {
        const indexOfTag = Object.keys(row).indexOf(tag);

        // dose not include tag at the header
        if (indexOfTag === -1) {
          return;
        }

        if (Generate.permissionTags[row.type][tag] === null) {
          return;
        }

        // validates inputs
        if (!this.isValidInputs(tag, row, rowIndex, indexOfTag)) {
          return;
        }

        metaItem[tag][0] = this.convertSpecialChars(row[tag]);
      });

      Object.keys(row).sort();
      row['$'] = { xmlns: Generate.xmlSetting.xmlns };
      const xmlBuilder = new xml2js.Builder({
        renderOpts: { pretty: true, indent: ' '.repeat(Generate.indentationLength), newline: '\n' },
        xmldec: { version: Generate.xmlSetting.version, encoding: Generate.xmlSetting.encoding, standalone: undefined },
      });
      const xml = xmlBuilder.buildObject(Generate.metaJson);
      Generate.metaXmls[fullName] = xml;
    });
    Generate.successResults.push({
      FULLNAME: fullName + Generate.profileExtension,
      PATH: join(flags.outputdir, fullName + Generate.profileExtension).replace('//', '/'),
    });

    if (Generate.validationResults.length > 0) {
      this.showValidationErrorMessages();
    } else {
      this.saveMetaData(flags);
    }
    return { MetaJson: Generate.metaJson };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Generate.profileExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    return parse(path).base.replace(Generate.profileExtension, '');
  }

  // eslint-disable-next-line complexity
  private isValidInputs(tag: string, row: { [key: string]: string }, rowIndex: number, colIndex: number): boolean {
    const validationResLenBefore = Generate.validationResults.length;
    const errorIndex = 'Row' + String(rowIndex + 1) + 'Col' + String(colIndex + 1);
    const rowList = Object.values(row);
    const type = row.type;

    switch (tag) {
      case 'editable':
        this.validatesEditable(type, rowList, colIndex, errorIndex);
        break;
      case 'readable':
        this.validatesReadable(type, rowList, colIndex, errorIndex);
        break;
      case 'allowCreate':
        this.validatesAllowCreate(type, rowList, colIndex, errorIndex);
        break;
      case 'allowDelete':
        this.validatesAllowDelete(type, rowList, colIndex, errorIndex);
        break;
      case 'allowEdit':
        this.validatesAllowEdit(type, rowList, colIndex, errorIndex);
        break;
      case 'allowRead':
        this.validatesAllowRead(type, rowList, colIndex, errorIndex);
        break;
      case 'modifyAllRecords':
        this.validatesModiryAllRecords(type, rowList, colIndex, errorIndex);
        break;
      case 'viewAllRecords':
        this.validatesViewAllRecords(type, rowList, colIndex, errorIndex);
        break;
      case 'default':
        this.validatesDefault(type, rowList, colIndex, errorIndex);
        break;
      case 'visible':
        this.validatesVisible(type, rowList, colIndex, errorIndex);
        break;
      case 'enabled':
        this.validatesEnable(type, rowList, colIndex, errorIndex);
        break;
      case 'visibility':
        this.validatesVisibility(type, rowList, colIndex, errorIndex);
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
    flags: { input: string | undefined; outputdir: string; source: string | undefined; delimiter: string } & {
      [flag: string]: any;
    } & { json: boolean | undefined }
  ): void {
    const blue = '\u001b[34m';
    const white = '\u001b[37m';
    console.log('===' + blue + ' Generated Source' + white);
    console.table(Generate.successResults);
    Object.keys(Generate.metaXmls).forEach((fullName) => {
      if (existsSync(join(flags.outputdir, fullName + '.' + Generate.profileExtension))) {
        // for creating
        writeFileSync(
          join(flags.outputdir, fullName + '.' + Generate.profileExtension),
          Generate.metaXmls[fullName],
          'utf8'
        );
      }
    });
  }

  private showValidationErrorMessages(): void {
    console.table(Generate.validationResults);
    throw new SfError(messages.getMessage('validation'));
  }
}
