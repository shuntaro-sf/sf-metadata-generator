/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable guard-for-in */
/* eslint-disable class-methods-use-this */
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ux } from '@oclif/core';
import csvtojson from 'csvtojson';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import { Json } from '../../../utils/type';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'listview.generate');

export type listviewGenerateResult = {
  MetaJson: Json;
};

export default class Generate extends SfCommand<listviewGenerateResult> {
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
      default: ConfigData.listviewGenerateConfig.delimiter,
    }),
    picklistdelimiter: Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.picklistdelimiter.summary'),
      default: ConfigData.listviewGenerateConfig.columnsDelimiter,
    }),
  };

  private static xmlSetting = ConfigData.listviewGenerateConfig.xmlSetting as { [key: string]: string };
  private static defaultValues = ConfigData.listviewGenerateConfig.defaultValues as Json;
  // private static valueSetDefaultValues = ConfigData.listviewGenerateConfig.valueSetDefaultValues as Json;
  private static filtersDefaultValues = ConfigData.listviewGenerateConfig.filtersDefaultValues as Json;
  private static isRequired = ConfigData.listviewGenerateConfig.isRequired as Json;
  private static options = ConfigData.listviewGenerateConfig.options as Json;
  private static indentationLength = ConfigData.listviewGenerateConfig.indentationLength;
  private static listviewExtension = ConfigData.listviewGenerateConfig.listviewExtension;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static failureResults = [] as Array<{ [key: string]: string }>;
  private static metaXmls = {} as { [key: string]: string };
  private static metaJson = {} as { [key: string]: any };

  public async run(): Promise<listviewGenerateResult> {
    const { flags } = await this.parse(Generate);

    if (flags.input === undefined || !existsSync(flags.input)) {
      throw new SfError(messages.getMessage('error.path.input') + flags.input);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }

    const csvJson = await csvtojson().fromFile(flags.input);
    csvJson.forEach((row, rowIndex) => {
      rowIndex++;
      const removedKeys = [] as string[];
      const typeIndex = Object.keys(row).indexOf('type');
      if (!Object.keys(row).includes('type')) {
        this.pushValidationResult('Row' + String(rowIndex + 1), messages.getMessage('validation.no.type'));
        return;
      }
      if (!Generate.options.type.includes(row.type)) {
        this.pushValidationResult(
          'Row' + String(rowIndex + 1) + 'Col' + String(typeIndex + 1),
          messages.getMessage('validation.type.options') + Generate.options.type.toString()
        );
        return;
      }

      Object.keys(Generate.defaultValues[row.type]).forEach((tag) => {
        const indexOfTag = Object.keys(row).indexOf(tag);

        // dose not include tag at the header and the tag is not required
        if (indexOfTag === -1 && Generate.isRequired[row.type][tag] === null) {
          removedKeys.push(tag);
          return;
        }
        // when not applicable tag
        if (Generate.isRequired[row.type][tag] === null && Generate.defaultValues[row.type][tag] === null) {
          removedKeys.push(tag);
          return;
        }
        // to omit tag that dosent need to be xml tag if blank
        if (
          !Generate.isRequired[row.type][tag] &&
          Generate.defaultValues[row.type][tag] === null &&
          (indexOfTag === -1 || row[tag] === '')
        ) {
          removedKeys.push(tag);
          return;
        }

        // set defaultvalue
        if (row[tag] === '' && Generate.defaultValues[row.type][tag] !== null) {
          row[tag] = Generate.defaultValues[row.type][tag];
        }
        // validates inputs
        if (!this.isValidInputs(tag, row, rowIndex, indexOfTag)) {
          return;
        }

        if ((tag === 'picklistFullName' || tag === 'picklistLabel') && Object.keys(row).includes(tag)) {
          row[tag] = row[tag].split(flags.picklistdelimiter);
        }
      });

      // valueSet
      if (row.type === 'Picklist' || row.type === 'MultiselectPicklist') {
        this.getPicklistMetaStr(row, rowIndex);
      }
      // summaryFilterItems
      if (row.type === 'Summary') {
        this.getSummaryFilterItemsMetaStr(row);
      }
      // formula//
      if (Object.keys(row).includes('formula') && row.formula !== '') {
        this.formatRowForFormula(row);
      }

      Generate.successResults.push({
        FULLNAME: row.fullName + '.' + Generate.listviewExtension,
        PATH: join(flags.outputdir, row.fullName + '.' + Generate.listviewExtension).replace('//', '/'),
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
      Generate.metaJson[row.fullName] = { Customlistview: row };
      const xmlBuilder = new xml2js.Builder({
        renderOpts: { pretty: true, indent: ' '.repeat(Generate.indentationLength), newline: '\n' },
        xmldec: { version: Generate.xmlSetting.version, encoding: Generate.xmlSetting.encoding, standalone: undefined },
        allowSurrogateChars: true,
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

  private getPicklistMetaStr(row: { [key: string]: any }, rowIndex: number): void {
    if (!this.isValidInputsForPicklist(row, rowIndex)) {
      return;
    }
    const valueSetDefinitionElm = Generate.filtersDefaultValues;
    const valueElms = [] as Array<{ [key: string]: any }>;
    for (let idx = 0; idx < row.picklistFullName.length; idx++) {
      const valueElm = { ...valueSetDefinitionElm.value[0] };
      Object.keys(valueSetDefinitionElm.value[0]).forEach((tag) => {
        const tagForRow = 'picklist' + tag.substring(0, 1).toUpperCase() + tag.substring(1);
        if (Object.keys(row).includes(tagForRow)) {
          valueElm[tag] = row[tagForRow][idx];
        }
      });
      valueElms.push(valueElm);
    }
    valueSetDefinitionElm['value'] = valueElms;
    row['valueSet'] = { valueSetDefinition: valueSetDefinitionElm };
    delete row.picklistFullName;
    delete row.picklistLabel;
  }

  private getSummaryFilterItemsMetaStr(row: { [key: string]: any }): void {
    // when there are no summaryFilterItems columns
    const noSummaryFilterItemsColumns =
      !Object.keys(row).includes('summaryFilterItemslistview') &&
      !Object.keys(row).includes('summaryFilterItemsOperation') &&
      !Object.keys(row).includes('summaryFilterItemsValue');
    const noSummaryFilterItemsInputs =
      row.summaryFilterItemslistview === '' &&
      row.summaryFilterItemsOperation === '' &&
      row.summaryFilterItemsValue === '';
    if (noSummaryFilterItemsColumns || noSummaryFilterItemsInputs) {
      delete row.summaryFilterItemslistview;
      delete row.summaryFilterItemsOperation;
      delete row.summaryFilterItemsValue;
      return;
    } /*
    if (!this.isValidInputsForSummaryFilterItems(row, rowIndex)) {
      return;
    }*/
    const summaryFilterItemsElm = { ...Generate.filtersDefaultValues };
    Object.keys(summaryFilterItemsElm).forEach((tag) => {
      const tagForRow = 'summaryFilterItems' + tag.substring(0, 1).toUpperCase() + tag.substring(1);
      if (Object.keys(row).includes(tagForRow)) {
        summaryFilterItemsElm[tag] = row[tagForRow];
      }
    });

    row['summaryFilterItems'] = summaryFilterItemsElm;
    delete row.summaryFilterItemslistview;
    delete row.summaryFilterItemsOperation;
    delete row.summaryFilterItemsValue;
  }

  private formatRowForFormula(row: { [key: string]: any }): void {
    if (
      row.type === 'Checkbox' ||
      row.type === 'Currency' ||
      row.type === 'Date' ||
      row.type === 'Datetime' ||
      row.type === 'Number' ||
      row.type === 'Percent' ||
      row.type === 'Text' ||
      row.type === 'Time'
    ) {
      if (Object.keys(row).includes('defaultValue')) {
        delete row.defaultValue;
      }
    }
    if (row.type === 'Text') {
      if (Object.keys(row).includes('length')) {
        delete row.length;
      }
    }
  }

  // eslint-disable-next-line complexity
  private isValidInputs(tag: string, row: { [key: string]: string }, rowIndex: number, colIndex: number): boolean {
    const validationResLenBefore = Generate.validationResults.length;

    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;
    const errorIndex = 'Row' + String(rowIndex + 1) + 'Col' + String(colIndex + 1);

    const rowList = Object.values(row);
    switch (tag) {
      case 'fullName':
        this.validatesFullName(regExpForSnakeCase, rowList, colIndex, errorIndex);
        break;

      case 'label':
        this.validatesLabel(rowList, colIndex, errorIndex);
        break;
    }
    return validationResLenBefore === Generate.validationResults.length;
  }

  private validatesLabel(row: string[], indexOfTag: number, errorIndex: string): void {
    if (row[indexOfTag].length === 0) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.label.blank'));
    }
    if (row[indexOfTag].length > 40) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.label.length'));
    }
  }

  private validatesFullName(regExpForSnakeCase: RegExp, row: string[], indexOfTag: number, errorIndex: string): void {
    if (!regExpForSnakeCase.test(row[indexOfTag])) {
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

  private isValidInputsForPicklist(row: { [key: string]: string }, rowIndex: number): boolean {
    const header = Object.keys(row);
    const validationResLenBefore = Generate.validationResults.length;
    const typeColIndex = header.indexOf('type');
    const picklistFullNamesColIndex = header.indexOf('picklistFullName');
    const picklistLabelsColIndex = header.indexOf('picklistLabel');
    const errorIndexForType = 'Row' + String(rowIndex + 1) + 'Col' + String(typeColIndex + 1);
    const errorIndexForFullName = 'Row' + String(rowIndex + 1) + 'Col' + String(picklistFullNamesColIndex + 1);
    const errorIndexForLabel = 'Row' + String(rowIndex + 1) + 'Col' + String(picklistLabelsColIndex + 1);
    // when picklist fullnames or labels are not found
    if (!Object.keys(row).includes('picklistFullName')) {
      this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.picklist.fullname'));
    }
    if (!Object.keys(row).includes('picklistLabel')) {
      this.pushValidationResult(errorIndexForType, messages.getMessage('validation.no.picklist.label'));
    }

    const picklistFullNames = row.picklistFullName;
    const picklistLabels = row.picklistLabel;

    if (picklistFullNames.length !== picklistLabels.length) {
      this.pushValidationResult(errorIndexForFullName, messages.getMessage('validation.picklist.fullname.number'));
      this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.picklist.label.number'));
    }
    if (picklistFullNames.length > 1000) {
      this.pushValidationResult(errorIndexForFullName, messages.getMessage('validation.picklist.fullname.length'));
    }
    if (picklistLabels.length > 1000) {
      this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.picklist.label.length'));
    }
    for (let idx = 0; idx < picklistFullNames.length; idx++) {
      if (picklistFullNames[idx].length === 0) {
        this.pushValidationResult(errorIndexForFullName, messages.getMessage('validation.picklist.fullname.blank'));
      }
      if (picklistLabels[idx].length === 0) {
        this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.picklist.label.blank'));
      }
      if (picklistFullNames[idx].length > 255) {
        this.pushValidationResult(errorIndexForFullName, messages.getMessage('validation.picklist.fullname.max'));
      }
      if (picklistLabels[idx].length > 255) {
        this.pushValidationResult(errorIndexForLabel, messages.getMessage('validation.picklist.label.max'));
      }
    }
    return validationResLenBefore === Generate.validationResults.length;
  }
  /*
  private isValidInputsForSummaryFilterItems(row: { [key: string]: string }, rowIndex: number): boolean {
    const header = Object.keys(row);
    const validationResLenBefore = Generate.validationResults.length;
    const listviewColIndex = header.indexOf('summaryFilterItemslistview');
    const operationColIndex = header.indexOf('summaryFilterItemsOperation');
    const valueColIndex = header.indexOf('summaryFilterItemsValue');
    const errorIndexForlistview = 'Row' + String(rowIndex + 1) + 'Col' + String(listviewColIndex + 1);
    const errorIndexForOperation = 'Row' + String(rowIndex + 1) + 'Col' + String(operationColIndex + 1);
    const errorIndexForValue = 'Row' + String(rowIndex + 1) + 'Col' + String(valueColIndex + 1);

    // when tags of summaryFilterItems are not found
    if (!Object.keys(row).includes('summaryFilterItemslistview')) {
      this.pushValidationResult(errorIndexForlistview, messages.getMessage('validation.no.summaryfilteritemslistview'));
    }
    if (!Object.keys(row).includes('summaryFilterItemsOperation')) {
      this.pushValidationResult(
        errorIndexForOperation,
        messages.getMessage('validation.no.summaryfilteritemsoperation')
      );
    }
    if (!Object.keys(row).includes('summaryFilterItemsValue')) {
      this.pushValidationResult(errorIndexForValue, messages.getMessage('validation.no.summaryfilteritemsvalue'));
    }
    const listview = row.summaryFilterItemslistview;
    const operation = row.summaryFilterItemsOperation;
    const value = row.summaryFilterItemsValue;

    // for listview tag
    const fullNameSplit = listview.split('.');
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;

    if (fullNameSplit.length !== 2) {
      this.pushValidationResult(
        errorIndexForlistview,
        messages.getMessage('validation.summarizedlistview.invalid.reference')
      );
    } else {
      if (!regExpForSnakeCase.test(fullNameSplit[0]) || !regExpForSnakeCase.test(fullNameSplit[1])) {
        this.pushValidationResult(
          errorIndexForlistview,
          messages.getMessage('validation.summaryfilteritemslistview.format')
        );
      }
      if (fullNameSplit[0].split('__').length > 2 || fullNameSplit[1].split('__').length > 2) {
        this.pushValidationResult(
          errorIndexForlistview,
          messages.getMessage('validation.summaryfilteritemslistview.underscore')
        );
      }
      if (fullNameSplit[0].length === 0 || fullNameSplit[1].length === 0) {
        this.pushValidationResult(
          errorIndexForlistview,
          messages.getMessage('validation.summaryfilteritemslistview.blank')
        );
      }
      if (!this.isValidLengthForSummary(fullNameSplit)) {
        this.pushValidationResult(
          errorIndexForlistview,
          messages.getMessage('validation.summaryfilteritemslistview.length')
        );
      }
    }

    // for operation tag
    if (!Generate.options.summaryFilterItemsOperation.includes(operation)) {
      this.pushValidationResult(
        errorIndexForOperation,
        messages.getMessage('validation.summaryfilteritemsoperation.options') +
          Generate.options.summaryFilterItemsOperation.toString()
      );
    }
    // for value tag
    if (value.length > 255) {
      this.pushValidationResult(errorIndexForValue, messages.getMessage('validation.summaryfilteritemsvalue.length'));
    }

    return validationResLenBefore === Generate.validationResults.length;
  }*/

  private pushValidationResult(index: string, errorMessage: string): void {
    Generate.validationResults.push({ INDEX: index, PROBLEM: errorMessage });
  }
  /*
  private isValidLengthForSummary(fullNames: string[]): boolean {
    let isValidLength = true;
    for (const fullName of fullNames) {
      const isCustomlistview = fullName.endsWith('__c');
      if (isCustomlistview) {
        isValidLength = fullName.length <= 43 && isValidLength;
      } else {
        isValidLength = fullName.length <= 40 && isValidLength;
      }
    }
    return isValidLength;
  }
*/
  private showValidationErrorMessages(): void {
    this.logTable(Generate.validationResults);
    throw new SfError(messages.getMessage('validation'));
  }

  private saveMetaData(
    flags: {
      input: string | undefined;
      outputdir: string;
      updates: boolean;
      delimiter: string;
      picklistdelimiter: string;
    } & { [flag: string]: any } & { json: boolean | undefined }
  ): void {
    const blue = '\u001b[34m';
    const white = '\u001b[37m';
    this.log('===' + blue + ' Generated Source' + white);
    this.logTable(Generate.successResults);
    Object.keys(Generate.metaXmls).forEach((fullName) => {
      if (
        (!flags.updates && !existsSync(join(flags.outputdir, fullName + '.' + Generate.listviewExtension))) ||
        flags.updates
      ) {
        // for creating
        writeFileSync(
          join(flags.outputdir, fullName + '.' + Generate.listviewExtension),
          Generate.metaXmls[fullName],
          'utf8'
        );
      } else {
        // when fail to save
        Generate.failureResults.push({
          FILENAME: fullName + '.' + Generate.listviewExtension,
          MESSAGE:
            'Failed to save ' + fullName + '.' + Generate.listviewExtension + '. ' + messages.getMessage('failureSave'),
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
