/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ux } from '@oclif/core';
import csvtojson from 'csvtojson';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import { Json } from '../../../utils/type';
import * as ConfigData from '../../../';

export type MetaInfo = {
  fullName: string;
  metaStr: string;
};

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'object.generate');

export type ObjectGenerateResult = {
  MetaJson: Json;
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
  private static defaultValues = ConfigData.objectGenerateConfig.defaultValues as Json;
  private static isRequired = ConfigData.objectGenerateConfig.isRequired as Json;
  private static nameFieldDefaultValues = ConfigData.objectGenerateConfig.nameFieldDefaultValues as Json;
  private static options = ConfigData.objectGenerateConfig.options as Json;
  private static indentationLength = ConfigData.objectGenerateConfig.indentationLength;
  private static objectExtension = ConfigData.objectGenerateConfig.objectExtension;
  private static delimiter = ConfigData.objectGenerateConfig.delimiter;
  private static metaSettings = ConfigData.objectGenerateConfig.metaSettings as Json;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static failureResults = [] as Array<{ [key: string]: string }>;
  private static metaXmls = {} as { [key: string]: string };
  private static metaJson = {} as { [key: string]: any };

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

    const csvJson = await csvtojson().fromFile(flags.input);

    csvJson.forEach((row, rowIndex) => {
      rowIndex++;
      const removedKeys = [] as string[];

      Object.keys(Generate.defaultValues).forEach((tag) => {
        const colIndex = Object.keys(row).indexOf(tag);
        const indexOfTag = Object.keys(row).indexOf(tag);

        // dose not include tag at the header and the tag is not required
        if (indexOfTag === -1 && Generate.isRequired[tag] === null) {
          removedKeys.push(tag);
          return;
        }
        // when not applicable tag
        if (Generate.isRequired[tag] === null && Generate.defaultValues[tag] === null) {
          removedKeys.push(tag);
          return;
        }
        // to omit tag that dosent need to be xml tag if blank
        if (
          !Generate.isRequired[tag] &&
          Generate.defaultValues[tag] === null &&
          (indexOfTag === -1 || row[tag] === '')
        ) {
          removedKeys.push(tag);
          return;
        }
        // set defaultvalue
        if (row[tag] === '' && Generate.defaultValues[tag] !== null) {
          row[tag] = Generate.defaultValues[tag];
        }
        // validates inputs
        if (!this.isValidInputs(tag, row, rowIndex, colIndex)) {
          return;
        }
      });
      // nameField
      this.pushNameFieldMetaStr(row, rowIndex);

      // metaSettings
      this.getMetaSettings(row);

      Generate.successResults.push({
        FULLNAME: row.fullName + Generate.objectExtension,
        PATH: join(flags.outputdir, row.fullName + Generate.objectExtension).replace('//', '/'),
      });

      removedKeys.forEach((key) => {
        delete row[key];
      });

      row = Object.keys(row)
        .sort()
        .reduce((obj: { [key: string]: any }, key) => {
          obj[key] = row[key];
          return obj;
        }, {});
      row['$'] = { xmlns: Generate.xmlSetting.xmlns };
      Generate.metaJson[row.fullName] = { CustomObject: row };
      const xmlBuilder = new xml2js.Builder({
        renderOpts: { pretty: true, indent: ' '.repeat(Generate.indentationLength), newline: '\n' },
        xmldec: { version: Generate.xmlSetting.version, encoding: Generate.xmlSetting.encoding, standalone: undefined },
      });
      const xml = xmlBuilder.buildObject(Generate.metaJson[row.fullName]);
      Generate.metaXmls[row.fullName] = xml;
    });

    if (Generate.validationResults.length > 0) {
      this.showValidationErrorMessages();
    } else {
      this.saveMetaData(flags);
      this.showFailureResults();
    }
    return { MetaJson: Generate.metaJson };
  }

  private getMetaSettings(row: { [key: string]: any }): void {
    Object.keys(Generate.metaSettings).forEach((tag) => {
      row[tag] = Generate.metaSettings[tag];
    });
  }

  private pushNameFieldMetaStr(row: { [key: string]: any }, rowIndex: number): any {
    if (!this.isValidInputsForNameField(row, rowIndex)) {
      return;
    }

    const nameFieldElm = { ...Generate.nameFieldDefaultValues };
    Object.keys(nameFieldElm).forEach((tag) => {
      const tagForRow = 'nameField' + tag.substring(0, 1).toUpperCase() + tag.substring(1);
      if (Object.keys(row).includes(tagForRow)) {
        nameFieldElm[tag] = row[tagForRow];
      }
    });
    if (row.nameFieldType === 'Text') {
      delete nameFieldElm.displayFormat;
    }
    row['nameField'] = nameFieldElm;
    delete row.nameFieldType;
    delete row.nameFieldLabel;
    delete row.nameFieldDisplayFormat;
  }

  // eslint-disable-next-line complexity
  private isValidInputs(tag: string, row: { [key: string]: string }, rowIndex: number, colIndex: number): boolean {
    const validationResLenBefore = Generate.validationResults.length;
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;
    const errorIndex = 'Row' + String(rowIndex + 1) + 'Col' + String(colIndex + 1);
    const rowList = Object.values(row);

    switch (tag) {
      case 'fullName':
        this.validatesFullName(rowList, colIndex, regExpForSnakeCase, errorIndex);
        break;
      case 'label':
        this.validatesLabel(rowList, colIndex, errorIndex);
        break;
      case 'description':
        this.validatesDescription(rowList, colIndex, errorIndex);
        break;
      case 'inlineHelpText':
        this.validatesInlineHelpText(rowList, colIndex, errorIndex);
        break;
      case 'allowInChatterGroups':
        this.validatesAllowInChatterGroups(rowList, colIndex, errorIndex);
        break;
      case 'deploymentStatus':
        this.validatesDeploymentStatus(rowList, colIndex, errorIndex);
        break;
      case 'enableActivities':
        this.validatesEnableActivities(rowList, colIndex, errorIndex);
        break;
      case 'enableBulkApi':
        this.validatesEnableBulkApi(rowList, colIndex, errorIndex);
        break;
      case 'enableHistory':
        this.validatesEnableHistory(rowList, colIndex, errorIndex);
        break;
      case 'enableReports':
        this.validatesEnableReports(rowList, colIndex, errorIndex);
        break;
      case 'enableSearch':
        this.validatesEnableSearch(rowList, colIndex, errorIndex);
        break;
      case 'enableSharing':
        this.validatesEnableSharing(rowList, colIndex, errorIndex);
        break;
      case 'enableStreamingApi':
        this.validatesEnableStreamingApi(rowList, colIndex, errorIndex);
        break;
      case 'nameFieldType':
        this.validatesNameFieldType(rowList, colIndex, errorIndex);
        break;
      case 'sharingModel':
        this.validatesSharingModel(rowList, colIndex, errorIndex);
        break;
      case 'externalSharingModel':
        this.validatesExternalSharingModel(rowList, colIndex, errorIndex);
        break;
    }
    return validationResLenBefore === Generate.validationResults.length;
  }

  private validatesExternalSharingModel(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.externalSharingModel.includes(row[indexOfTag]) && row[indexOfTag] !== '') {
      this.pushValidationResult(
        errorIndex,
        messages.getMessage('validation.externalSharingModel.options') +
          Generate.options.externalSharingModel.toString()
      );
    }
  }

  private validatesSharingModel(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.sharingModel.includes(row[indexOfTag]) && row[indexOfTag] !== '') {
      this.pushValidationResult(
        errorIndex,
        messages.getMessage('validation.sharingModel.options') + Generate.options.sharingModel.toString()
      );
    }
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

  private isValidInputsForNameField(row: { [key: string]: string }, rowIndex: number): boolean {
    const header = Object.keys(row);
    const validationResLenBefore = Generate.validationResults.length;
    const nameFieldLabelColIndex = header.indexOf('nameFieldLabel');
    const nameFieldDisplayFormatColIndex = header.indexOf('nameFieldDisplayFormat');
    const nameFieldTypeColIndex = header.indexOf('nameFieldType');
    const errorIndexForType = 'Row' + String(rowIndex + 1) + 'Col' + String(nameFieldTypeColIndex + 1);
    const errorIndexForDisplayFormat =
      'Row' + String(rowIndex + 1) + 'Col' + String(nameFieldDisplayFormatColIndex + 1);
    const errorIndexForLabel = 'Row' + String(rowIndex + 1) + 'Col' + String(nameFieldLabelColIndex + 1);

    // when nameFieldLabel is not found
    if (!Object.keys(row).includes('nameFieldLabel')) {
      this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.namefieldlabel'));
    }
    if (!Object.keys(row).includes('nameFieldType')) {
      this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.namefieldtype'));
    }
    const nameFieldLabel = row.nameFieldLabel;
    const nameFieldType = row.nameFieldType;

    if (nameFieldLabel.length === 0) {
      this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.namefieldlabel.blank'));
    }
    if (nameFieldLabel.length > 80) {
      this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.namefieldlabel.length.format'));
    }

    if (nameFieldType === 'AutoNumber') {
      // when nameFieldDisplayFormat is not found
      if (!Object.keys(row).includes('nameFieldType')) {
        this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.namefieldtype'));
      }
      const nameFieldDisplayFormat = row.nameFieldDisplayFormat;
      const invalidChars = ['"', "'", '&', '<', '>', ';', ':', '\\'];
      const regExpInvalidChars = new RegExp('[' + invalidChars.join('').replace('\\', '\\\\') + ']+');
      const regExpNumber = /{(0+)}/;
      const formatNumber = nameFieldDisplayFormat.match(regExpNumber);

      if (regExpInvalidChars.test(nameFieldDisplayFormat)) {
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
      if (nameFieldDisplayFormat.length > 30) {
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

  private showValidationErrorMessages(): void {
    this.logTable(Generate.validationResults);
    throw new SfError(messages.getMessage('validation'));
  }

  private saveMetaData(
    flags: { input: string | undefined; outputdir: string; updates: boolean; delimiter: string } & {
      [flag: string]: any;
    } & { json: boolean | undefined }
  ): void {
    const blue = '\u001b[34m';
    const white = '\u001b[37m';
    this.log('===' + blue + ' Generated Source' + white);
    this.logTable(Generate.successResults);
    Object.keys(Generate.metaXmls).forEach((fullName) => {
      if (
        (!flags.updates && !existsSync(join(flags.outputdir, fullName + Generate.objectExtension))) ||
        flags.updates
      ) {
        // for creating
        writeFileSync(join(flags.outputdir, fullName + Generate.objectExtension), Generate.metaXmls[fullName], 'utf8');
      } else {
        // when fail to save
        Generate.failureResults.push({
          FILENAME: fullName + '.' + Generate.objectExtension,
          MESSAGE: 'Failed to save ' + fullName + Generate.objectExtension + '. ' + messages.getMessage('failureSave'),
        });
      }
    });
  }

  private showFailureResults(): void {
    if (Object.keys(Generate.failureResults).length === 0) {
      return;
    }
    const red = '\u001b[31m';
    const white = '\u001b[37m';
    this.log('\n===' + red + ' Failure' + white);
    this.logTable(Generate.failureResults);
  }

  private logTable(table: Array<{ [key: string]: string }>): void {
    if (table.length === 0) {
      return;
    }
    const columns: ux.Table.table.Columns<{ [key: string]: string }> = {};
    Object.keys(table[0]).forEach((key) => {
      columns[key] = { header: key };
    });
    this.table(table, columns);
  }
}
