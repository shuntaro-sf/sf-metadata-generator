/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as ConfigData from '../../../';

export type MetaInfo = {
  fullName: string;
  metaStr: string;
};

export type Results = { [key: string]: string };
export type DefaultValues = { [key: string]: any | DefaultValues };
export type IsRequired = { [key: string]: any | IsRequired };
export type Options = { [key: string]: any | Options };
export type ActionOverrides = { [key: string]: any | ActionOverrides };
export type MetaSettings = { [key: string]: any | MetaSettings };

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-metadata-generator', 'object.generate');

export type ObjectGenerateResult = {
  metaInfo: MetaInfo[];
};

export default class Generate extends SfCommand<ObjectGenerateResult> {
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
    updates: Flags.boolean({
      char: 'u',
      summary: messages.getMessage('flags.updates.summary'),
    }),
    delimiter: Flags.string({
      char: 'd',
      summary: messages.getMessage('flags.delimiter.summary'),
      default: ConfigData.objectGenerateConfig.delimiter,
    }),
  };

  private static xmlSetting = ConfigData.objectGenerateConfig.xmlSetting as { [key: string]: string };
  private static defaultValues = ConfigData.objectGenerateConfig.defaultValues as DefaultValues;
  private static isRequired = ConfigData.objectGenerateConfig.isRequired as IsRequired;
  private static options = ConfigData.objectGenerateConfig.options as Options;
  private static indentationLength = ConfigData.objectGenerateConfig.indentationLength;
  private static objectExtension = ConfigData.objectGenerateConfig.objectExtension;
  private static delimiter = ConfigData.objectGenerateConfig.delimiter;
  private static tagNames = ConfigData.objectGenerateConfig.tagNames;
  private static metaSettings = ConfigData.objectGenerateConfig.metaSettings as MetaSettings;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static failureResults = {} as { [key: string]: string };
  private static metaInfo = [] as MetaInfo[];

  public async run(): Promise<ObjectGenerateResult> {
    const { flags } = await this.parse(Generate);
    if (flags.input === undefined || !existsSync(flags.input)) {
      throw new SfError(messages.getMessage('error.path.input') + flags.input);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
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
      .map((e) => e.split(flags.delimiter).map((elm) => elm.trim()));

    const header = csv[0];
    for (let rowIndex = 1; rowIndex < csv.length; rowIndex++) {
      if (csv[rowIndex].length < header.length) {
        continue;
      }

      // generates metadata for each row
      const metaStr = this.getMetaStr(csv, rowIndex, header);

      if (Generate.validationResults.length > 0) {
        continue;
      }

      const indexOfFullName = header.indexOf('fullName');
      Generate.metaInfo.push({ fullName: csv[rowIndex][indexOfFullName], metaStr });
      Generate.successResults.push({
        FULLNAME: csv[rowIndex][indexOfFullName] + '.' + Generate.objectExtension,
        PATH: join(flags.outputdir, csv[rowIndex][indexOfFullName] + '.' + Generate.objectExtension).replace('//', '/'),
      });
    }
    if (Generate.validationResults.length > 0) {
      this.showValidationErrorMessages();
    } else {
      this.saveMetaData(flags);
      this.showFailureResults();
    }

    return { metaInfo: Generate.metaInfo };
  }

  private getMetaStr(csv: string[][], rowIndex: number, header: string[]): string {
    const row = csv[rowIndex];
    let tagStrs = [];
    let metaStr =
      '<?xml version="' +
      Generate.xmlSetting.version +
      '" encoding="' +
      Generate.xmlSetting.encoding +
      '"?>\n<CustomObject xmlns="' +
      Generate.xmlSetting.xmlns +
      '">';
    // const colIndex = indexOfType + 1;

    metaStr += this.getActionOverridesMetaStr();

    for (const tag in Generate.defaultValues) {
      const indexOfTag = header.indexOf(tag);

      // dose not include tag at the header and the tag is not required
      if (indexOfTag === -1 && Generate.isRequired[tag] === null) {
        continue;
      }
      // validates inputs
      if (!this.isValidInputs(tag, row, header, rowIndex)) {
        continue;
      }
      if (tag === 'fullName') {
        continue;
      }

      // when not applicable tag
      if (Generate.isRequired[tag] === null && Generate.defaultValues[tag] === null) {
        continue;
      }
      // to omit tag that dosent need to be xml tag if blank
      if (
        !Generate.isRequired[tag] &&
        Generate.defaultValues[tag] === null &&
        (indexOfTag === -1 || row[indexOfTag] === '')
      ) {
        continue;
      }

      if (indexOfTag !== -1) {
        // convert special characters in the html form
        row[indexOfTag] = this.convertSpecialChars(row[indexOfTag]);
        // format boolean string in a xml format
        this.formatBoolean(tag, row, indexOfTag);
      }

      let tagStr = null;
      if (row[indexOfTag] !== '') {
        tagStr = '<' + tag + '>' + row[indexOfTag] + '</' + tag + '>';
      } else {
        tagStr = '<' + tag + '>' + Generate.defaultValues[tag] + '</' + tag + '>';
      }
      tagStrs.push(tagStr);
    }

    this.pushNameFieldMetaStr(tagStrs, row, header, rowIndex);
    // metaStr += "\n" + this.getIndentation(Generate.indentationLength) + tagStrs.join("\n" + this.getIndentation(Generate.indentationLength));
    this.pushMetaStrSettings(tagStrs);

    tagStrs = tagStrs.filter((e) => e !== null);
    tagStrs.sort();
    metaStr +=
      '\n' +
      this.getIndentation(Generate.indentationLength) +
      tagStrs.join('\n' + this.getIndentation(Generate.indentationLength));
    //   metaStr += this.getMetaStrSettings(tagStrs);
    metaStr += '\n</CustomObject>';
    return metaStr;
  }

  private getActionOverridesMetaStr(): string {
    const actionOverridesMetaSetting = Generate.metaSettings['actionOverrides'] as ActionOverrides;
    let actionOverridesMetaStr = '';
    for (const actionName in actionOverridesMetaSetting) {
      actionOverridesMetaStr +=
        '\n' +
        this.getIndentation(Generate.indentationLength) +
        '<actionOverrides>\n' +
        this.getIndentation(2 * Generate.indentationLength);
      actionOverridesMetaStr +=
        '<actionName>' + actionName + '</actionName>\n' + this.getIndentation(2 * Generate.indentationLength);
      actionOverridesMetaStr +=
        '<type>' +
        actionOverridesMetaSetting[actionName]['type'] +
        '</type>\n' +
        this.getIndentation(Generate.indentationLength);
      actionOverridesMetaStr += '</actionOverrides>';
      for (const formFactor of actionOverridesMetaSetting[actionName]['formFactor']) {
        actionOverridesMetaStr +=
          '\n' +
          this.getIndentation(Generate.indentationLength) +
          '<actionOverrides>\n' +
          this.getIndentation(2 * Generate.indentationLength);
        actionOverridesMetaStr +=
          '<actionName>' + actionName + '</actionName>\n' + this.getIndentation(2 * Generate.indentationLength);
        actionOverridesMetaStr +=
          '<formFactor>' + formFactor + '</formFactor>\n' + this.getIndentation(2 * Generate.indentationLength);
        actionOverridesMetaStr +=
          '<type>' +
          actionOverridesMetaSetting[actionName]['type'] +
          '</type>\n' +
          this.getIndentation(Generate.indentationLength);
        actionOverridesMetaStr += '</actionOverrides>';
      }
    }
    return actionOverridesMetaStr;
  }

  private pushMetaStrSettings(tagStrs: string[]): void {
    for (const tagName in Generate.metaSettings) {
      if (tagName === 'actionOverrides') {
        continue;
      }
      tagStrs.push('<' + tagName + '>' + Generate.metaSettings[tagName] + '</' + tagName + '>');
    }
  }

  private pushNameFieldMetaStr(tagStrs: string[], row: string[], header: string[], rowIndex: number): void {
    let nameFieldMetaStr = '<nameField>\n' + this.getIndentation(2 * Generate.indentationLength);
    const indexOfNameFieldType = header.indexOf('nameFieldType');
    const indexOfNameFieldLabel = header.indexOf('nameFieldLabel');

    if (!this.isValidInputsForNameField(row, header, rowIndex)) {
      return;
    }

    const nameFieldType = row[indexOfNameFieldType];
    const nemeFieldLabel = this.convertSpecialChars(row[indexOfNameFieldLabel]);

    nameFieldMetaStr += '<label>' + nemeFieldLabel + '</label>\n' + this.getIndentation(2 * Generate.indentationLength);
    nameFieldMetaStr += '<trackHistory>false</trackHistory>\n' + this.getIndentation(2 * Generate.indentationLength);
    if (nameFieldType === 'AutoNumber') {
      const indexOfDisplayFormat = header.indexOf('nameFieldDisplayFormat');
      const displayFormat = row[indexOfDisplayFormat];
      nameFieldMetaStr +=
        '<displayFormat>' + displayFormat + '</displayFormat>\n' + this.getIndentation(2 * Generate.indentationLength);
    }
    nameFieldMetaStr += '<type>' + nameFieldType + '</type>\n' + this.getIndentation(Generate.indentationLength);
    nameFieldMetaStr += '</nameField>';
    tagStrs.push(nameFieldMetaStr);
  }

  private isValidInputs(tag: string, row: string[], header: string[], rowIndex: number): boolean {
    const indexOfTag = header.indexOf(tag);
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;
    const validationResLenBefore = Generate.validationResults.length;
    const errorIndex = 'Row' + (rowIndex + 1) + 'Col' + (indexOfTag + 1);

    if (indexOfTag === -1) {
      return true;
    }

    switch (tag) {
      case 'fullName':
        this.validatesFullName(row, indexOfTag, regExpForSnakeCase, errorIndex);
        break;
      case 'label':
        this.validatesLabel(row, indexOfTag, errorIndex);
        break;
      case 'description':
        this.validatesDescription(row, indexOfTag, errorIndex);
        break;
      case 'inlineHelpText':
        this.validatesInlineHelpText(row, indexOfTag, errorIndex);
        break;
      case 'allowInChatterGroups':
        this.validatesAllowInChatterGroups(row, indexOfTag, errorIndex);
        break;
      case 'deploymentStatus':
        this.validatesDeploymentStatus(row, indexOfTag, errorIndex);
        break;
      case 'enableActivities':
        this.validatesEnableActivities(row, indexOfTag, errorIndex);
        break;
      case 'enableBulkApi':
        this.validatesEnableBulkApi(row, indexOfTag, errorIndex);
        break;
      case 'enableHistory':
        this.validatesEnableHistory(row, indexOfTag, errorIndex);
        break;
      case 'enableReports':
        this.validatesEnableReports(row, indexOfTag, errorIndex);
        break;
      case 'enableSearch':
        this.validatesEnableSearch(row, indexOfTag, errorIndex);
        break;
      case 'enableSharing':
        this.validatesEnableSharing(row, indexOfTag, errorIndex);
        break;
      case 'enableStreamingApi':
        this.validatesEnableStreamingApi(row, indexOfTag, errorIndex);
        break;
      case 'nameFieldType':
        this.validatesNameFieldType(row, indexOfTag, errorIndex);
        break;
    }
    return validationResLenBefore === Generate.validationResults.length;
  }

  private validatesNameFieldType(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.nameFieldType.includes(row[indexOfTag]) && row[indexOfTag] !== '') {
      this.pushValidationResult(
        errorIndex,
        messages.getMessage('validation.namefieldtype.options') + Generate.options.nameFieldType.toString()
      );
    }
  }

  private validatesEnableStreamingApi(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableStreamingApi.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enablestreamingapi.options'));
    }
  }

  private validatesEnableSharing(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableSharing.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enablesharing.options'));
    }
  }

  private validatesEnableSearch(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableSearch.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enablesearch.options'));
    }
  }

  private validatesEnableReports(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableReports.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enablereports.options'));
    }
  }

  private validatesEnableHistory(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableHistory.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enablehistory.options'));
    }
  }

  private validatesEnableBulkApi(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableBulkApi.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enablebulkapi.options'));
    }
  }

  private validatesEnableActivities(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.enableActivities.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.enableactivities.options'));
    }
  }

  private validatesDeploymentStatus(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.deploymentStatus.includes(row[indexOfTag]) && row[indexOfTag] !== '') {
      this.pushValidationResult(
        errorIndex,
        messages.getMessage('validation.deploymentstatus.options') + Generate.options.deploymentStatus.toString()
      );
    }
  }

  private validatesAllowInChatterGroups(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.allowInChatterGroups.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.allowinchattergroups.options'));
    }
  }

  private validatesInlineHelpText(row: string[], indexOfTag: number, errorIndex: string): void {
    if (row[indexOfTag].length > 510) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.inlinehelptext.length'));
    }
  }

  private validatesDescription(row: string[], indexOfTag: number, errorIndex: string): void {
    if (row[indexOfTag].length > 1000) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.description.length'));
    }
  }

  private validatesLabel(row: string[], indexOfTag: number, errorIndex: string): void {
    if (row[indexOfTag].length === 0) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.label.blank'));
    }
    if (row[indexOfTag].length > 40) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.label.length'));
    }
  }

  private validatesFullName(row: string[], indexOfTag: number, regExpForSnakeCase: RegExp, errorIndex: string): void {
    if (row[indexOfTag].length > 1 && !regExpForSnakeCase.test(row[indexOfTag])) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.format'));
    }
    if (!row[indexOfTag].endsWith('__c')) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.tail'));
    }
    if (row[indexOfTag].split('__').length > 2) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.underscore'));
    }
    if (row[indexOfTag].length === 0) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.blank'));
    }
    if (row[indexOfTag].length > 43) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.length'));
    }
  }

  private isValidInputsForNameField(row: string[], header: string[], rowIndex: number): boolean {
    const validationResLenBefore = Generate.validationResults.length;

    const indexOfType = header.indexOf('nameFieldType');
    const indexOfLabel = header.indexOf('nameFieldLabel');
    const indexOfDisplayFormat = header.indexOf('nameFieldDisplayFormat');
    const type = row[indexOfType];
    const errorIndexForType = 'Row' + (rowIndex + 1) + 'Col' + (indexOfType + 1);
    const errorIndexForLabel = 'Row' + (rowIndex + 1) + 'Col' + (indexOfLabel + 1);
    const errorIndexForDisplayFormat = 'Row' + (rowIndex + 1) + 'Col' + (indexOfDisplayFormat + 1);

    // when nameFieldLabel is not found
    if (indexOfLabel === -1) {
      this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.namefieldlabel'));
    }

    if (row[indexOfLabel].length === 0) {
      this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.namefieldlabel.blank'));
    }
    if (row[indexOfLabel].length > 80) {
      this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.namefieldlabel.length.format'));
    }

    if (type === 'AutoNumber') {
      const invalidChars = ['"', "'", '&', '<', '>', ';', ':', '\\'];
      const regExpInvalidChars = new RegExp('[' + invalidChars.join('').replace('\\', '\\\\') + ']+');
      const regExpNumber = /{(0+)}/;
      const formatNumber = row[indexOfDisplayFormat].match(regExpNumber);

      // when nameFieldDisplayFormat is not found
      if (indexOfDisplayFormat === -1) {
        this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.namefielddisplayformat'));
      }

      if (regExpInvalidChars.test(row[indexOfDisplayFormat])) {
        this.pushValidationResult(
          errorIndexForDisplayFormat,
          messages.getMessage('validation.namefielddisplayformat.invalid.char') + invalidChars.toString()
        );
      }
      if (formatNumber === null) {
        this.pushValidationResult(
          errorIndexForDisplayFormat,
          messages.getMessage('validation.namefielddisplayformat.format')
        );
      } else if (formatNumber[1].length > 10) {
        this.pushValidationResult(
          errorIndexForDisplayFormat,
          messages.getMessage('validation.namefielddisplayformat.digits')
        );
      }
      if (row[indexOfDisplayFormat].length > 30) {
        this.pushValidationResult(
          errorIndexForDisplayFormat,
          messages.getMessage('validation.namefielddisplayformat.length')
        );
      }
    }

    return validationResLenBefore === Generate.validationResults.length;
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

  private formatBoolean(tag: string, row: string[], indexOfTag: number): void {
    if (Generate.options[tag] !== undefined) {
      if (Generate.options[tag].includes(true.toString()) && Generate.options[tag].includes(false.toString())) {
        row[indexOfTag] = row[indexOfTag].toLowerCase();
      }
    }
  }

  private showValidationErrorMessages(): void {
    const logLengths = this.getLogLenghts(Generate.validationResults);
    this.showLogHeader(logLengths);
    this.showLogBody(Generate.validationResults, logLengths);
    throw new SfError(messages.getMessage('validation'));
  }

  private saveMetaData(
    flags: { input: string | undefined; outputdir: string; updates: boolean; delimiter: string } & {
      [flag: string]: any;
    } & { json: boolean | undefined }
  ): void {
    const logLengths = this.getLogLenghts(Generate.successResults);
    const blue = '\u001b[34m';
    const white = '\u001b[37m';
    console.log('===' + blue + ' Generated Source' + white);
    this.showLogHeader(logLengths);
    for (const meta of Generate.metaInfo) {
      if (!existsSync(join(flags.outputdir, meta.fullName))) {
        // for creating
        mkdirSync(join(flags.outputdir, meta.fullName));
        writeFileSync(
          join(flags.outputdir, meta.fullName, meta.fullName + '.' + Generate.objectExtension),
          meta.metaStr,
          'utf8'
        );
      } else if (flags.updates) {
        // for updating
        this.updateFile(meta, flags);
      } else {
        // when fail to save
        Generate.failureResults[meta.fullName + '.' + Generate.objectExtension] =
          'Failed to save ' +
          meta.fullName +
          '.' +
          Generate.objectExtension +
          '. ' +
          messages.getMessage('failureSave');
      }
    }
    this.showLogBody(Generate.successResults, logLengths);
  }

  private updateFile(
    meta: MetaInfo,
    flags: { input: string | undefined; outputdir: string; updates: boolean; delimiter: string } & {
      [flag: string]: any;
    } & { json: boolean | undefined }
  ): void {
    let metastrToUpdate = readFileSync(
      join(flags.outputdir, meta.fullName, meta.fullName + '.' + Generate.objectExtension),
      'utf8'
    );
    for (const tag of Generate.tagNames) {
      if (tag !== 'nameFieldType' && tag !== 'nameFieldLabel') {
        const regexp = new RegExp('\\<' + tag + '\\>(.+)\\</' + tag + '\\>');
        const newValue = meta.metaStr.match(regexp);
        if (newValue !== null) {
          metastrToUpdate = metastrToUpdate.replace(regexp, newValue[0]);
        }
      } else {
        const regexp = new RegExp('\\<nameField\\>[\\s\\S]*\\</nameField\\>');
        const newValue = meta.metaStr.match(regexp);
        if (newValue !== null) {
          metastrToUpdate = metastrToUpdate.replace(regexp, newValue[0]);
        }
      }
    }
    writeFileSync(
      join(flags.outputdir, meta.fullName, meta.fullName + '.' + Generate.objectExtension),
      metastrToUpdate,
      'utf8'
    );
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
      if (Generate.failureResults[log.FULLNAME]) {
        continue;
      }
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

  private showFailureResults(): void {
    if (Object.keys(Generate.failureResults).length === 0) {
      return;
    }
    const red = '\u001b[31m';
    const white = '\u001b[37m';
    console.log('\n===' + red + ' Failure' + white);
    for (const fullName in Generate.failureResults) {
      console.log(Generate.failureResults[fullName]);
    }
  }

  private getIndentation(length: number): string {
    const whiteSpace = ' ';
    return whiteSpace.repeat(length);
  }
}
