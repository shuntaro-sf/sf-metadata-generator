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

export type ListviewGenerateResult = {
  MetaJson: Json;
};

export default class Generate extends SfCommand<ListviewGenerateResult> {
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
    columnsdelimiter: Flags.string({
      char: 'c',
      summary: messages.getMessage('flags.columnsdelimiter.summary'),
      default: ConfigData.listviewGenerateConfig.columnsDelimiter,
    }),
  };

  private static xmlSetting = ConfigData.listviewGenerateConfig.xmlSetting as { [key: string]: string };
  private static defaultValues = ConfigData.listviewGenerateConfig.defaultValues as Json;
  private static filtersDefaultValues = ConfigData.listviewGenerateConfig.filtersDefaultValues as Json;
  private static sharedToDefaultValues = ConfigData.listviewGenerateConfig.sharedToDefaultValues as Json;
  private static isRequired = ConfigData.listviewGenerateConfig.isRequired as Json;
  private static options = ConfigData.listviewGenerateConfig.options as Json;
  private static indentationLength = ConfigData.listviewGenerateConfig.indentationLength;
  private static listviewExtension = ConfigData.listviewGenerateConfig.listviewExtension;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static failureResults = [] as Array<{ [key: string]: string }>;
  private static metaXmls = {} as { [key: string]: string };
  private static metaJson = {} as { [key: string]: any };

  public async run(): Promise<ListviewGenerateResult> {
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

      Object.keys(Generate.defaultValues).forEach((tag) => {
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
        if (!this.isValidInputs(tag, row, rowIndex, indexOfTag)) {
          return;
        }

        if (
          (tag === 'columns' ||
            tag === 'filtersField' ||
            tag === 'filtersOperation' ||
            tag === 'filtersValue' ||
            tag === 'sharedToRole' ||
            tag === 'sharedToRoleAndSubordinates' ||
            tag === 'sharedToGroup') &&
          Object.keys(row).includes(tag)
        ) {
          row[tag] = row[tag].split(flags.columnsdelimiter);
        }
      });

      // filters
      this.getFiltersMetaStr(row, rowIndex);

      // shredTo
      this.getSharedToMetaStr(row, rowIndex);

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
      Generate.metaJson[row.fullName] = { ListView: row };
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

  private getFiltersMetaStr(row: { [key: string]: any }, rowIndex: number): void {
    // when there are no filters columns
    const noFiltersColumns =
      !Object.keys(row).includes('filtersField') &&
      !Object.keys(row).includes('filtersOperation') &&
      !Object.keys(row).includes('filtersValue');
    const noFiltersInputs = row.filtersField === '' && row.filtersOperation === '' && row.filtersValue === '';

    if (noFiltersColumns || noFiltersInputs) {
      delete row.filtersField;
      delete row.filtersOperation;
      delete row.filtersValue;
      return;
    }
    if (!this.isValidInputsForFilters(row, rowIndex)) {
      return;
    }
    const filtersElms = [] as Array<{ [key: string]: any }>;
    for (let idx = 0; idx < row.filtersField.length; idx++) {
      const filtersElm = { ...Generate.filtersDefaultValues };
      Object.keys(filtersElm).forEach((tag) => {
        const tagForRow = 'filters' + tag.substring(0, 1).toUpperCase() + tag.substring(1);
        if (Object.keys(row).includes(tagForRow)) {
          filtersElm[tag] = row[tagForRow][idx];
        }
      });
      filtersElms.push(filtersElm);
    }

    row['filters'] = filtersElms;
    delete row.filtersField;
    delete row.filtersOperation;
    delete row.filtersValue;
  }

  private getSharedToMetaStr(row: { [key: string]: any }, rowIndex: number): void {
    // when there are no filters columns
    if (!Object.keys(row).includes('sharedToRole') || row.sharedToRole === '') {
      delete row.sharedToRole;
    }
    if (!Object.keys(row).includes('sharedToRoleAndSubordinates') || row.sharedToRoleAndSubordinates === '') {
      delete row.sharedToRoleAndSubordinates;
    }
    if (!Object.keys(row).includes('sharedToGroup') || row.sharedToGroup === '') {
      delete row.sharedToGroup;
    }
    if (!this.isValidInputsForSharedTo(row, rowIndex)) {
      return;
    }

    const sharedToElm = { ...Generate.sharedToDefaultValues };
    const sharedToTagsToBeRemoved: string[] = [];

    Object.keys(sharedToElm).forEach((tag) => {
      const tagForRow = 'sharedTo' + tag.substring(0, 1).toUpperCase() + tag.substring(1);
      if (row[tagForRow] === undefined) {
        sharedToTagsToBeRemoved.push(tag);
        return;
      }
      for (const sharedToItemof of row[tagForRow]) {
        if (Object.keys(row).includes(tagForRow)) {
          sharedToElm[tag] = sharedToItemof;
        }
      }
    });
    sharedToTagsToBeRemoved.forEach((tag) => {
      delete sharedToElm[tag];
    });

    row['sharedTo'] = sharedToElm;
    delete row.sharedToRole;
    delete row.sharedToRoleAndSubordinates;
    delete row.sharedToGroup;
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
      case 'filterScope':
        this.validatesFilterScope(rowList, colIndex, errorIndex);
        break;
      case 'filtersOperation':
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

  private validatesFilterScope(row: string[], indexOfTag: number, errorIndex: string): void {
    if (row[indexOfTag] !== '') {
      if (!Generate.options.filterScope.includes(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.filterscope.options') + Generate.options.filtersOperation.toString()
        );
      }
    }
  }

  private isValidInputsForFilters(row: { [key: string]: any }, rowIndex: number): boolean {
    const header = Object.keys(row);
    const validationResLenBefore = Generate.validationResults.length;
    const fieldColIndex = header.indexOf('filtersField');
    const operationColIndex = header.indexOf('filtersOperation');
    const valueColIndex = header.indexOf('filtersValue');
    const errorIndexForField = 'Row' + String(rowIndex + 1) + 'Col' + String(fieldColIndex + 1);
    const errorIndexForOperation = 'Row' + String(rowIndex + 1) + 'Col' + String(operationColIndex + 1);
    const errorIndexForValue = 'Row' + String(rowIndex + 1) + 'Col' + String(valueColIndex + 1);

    // when tags of filters are not found
    if (!Object.keys(row).includes('filtersField')) {
      this.pushValidationResult(errorIndexForField, messages.getMessage('validation.no.filtersfield'));
    }
    if (!Object.keys(row).includes('filtersOperation')) {
      this.pushValidationResult(errorIndexForOperation, messages.getMessage('validation.no.filtersoperation'));
    }
    if (!Object.keys(row).includes('filtersValue')) {
      this.pushValidationResult(errorIndexForValue, messages.getMessage('validation.no.filtersvalue'));
    }

    const fields = row.filtersField;
    const operations = row.filtersOperation;
    const values = row.filtersValue;

    // for field tag
    fields.forEach((field: string) => {
      const regExpForSnakeCase = /^[A-Z][0-9A-Z_]+[A-Z]$/;
      const fullNameSplit = field.split('.');

      if (field === '' && Generate.options.summaryOperation.includes(row[operationColIndex])) {
        this.pushValidationResult(
          errorIndexForField,
          messages.getMessage('validation.filtersfield.no.filtersoperation')
        );
      }
      if (fullNameSplit.length !== 2) {
        this.pushValidationResult(errorIndexForField, messages.getMessage('validation.filtersfield.invalid.reference'));
      } else {
        if (!regExpForSnakeCase.test(fullNameSplit[0]) || !regExpForSnakeCase.test(fullNameSplit[1])) {
          this.pushValidationResult(errorIndexForField, messages.getMessage('validation.filtersfield.format'));
        }
        if (fullNameSplit[0].split('__').length > 2 || fullNameSplit[1].split('__').length > 2) {
          this.pushValidationResult(errorIndexForField, messages.getMessage('validation.filtersfield.underscore'));
        }
        if (fullNameSplit[0].length === 0 || fullNameSplit[1].length === 0) {
          this.pushValidationResult(errorIndexForField, messages.getMessage('validation.filtersfield.blank'));
        }
        if (!this.isValidLengthForFilter(fullNameSplit)) {
          this.pushValidationResult(errorIndexForField, messages.getMessage('validation.filtersfield.length'));
        }
      }
    });

    // for operation tag
    operations.forEach((operation: string) => {
      if (!Generate.options.filtersOperation.includes(operation)) {
        this.pushValidationResult(
          errorIndexForOperation,
          messages.getMessage('validation.filtersoperation.options') + Generate.options.filtersOperation.toString()
        );
      }
    });

    // for value tag
    values.forEach((value: string) => {
      if (value.length > 255) {
        this.pushValidationResult(errorIndexForValue, messages.getMessage('validation.filtersvalue.length'));
      }
    });

    return validationResLenBefore === Generate.validationResults.length;
  }

  private isValidInputsForSharedTo(row: { [key: string]: any }, rowIndex: number): boolean {
    const header = Object.keys(row);
    const validationResLenBefore = Generate.validationResults.length;
    const roleColIndex = header.indexOf('SharedToRole');
    const roleAndSubordinatesColIndex = header.indexOf('sharedToRoleAndSubordinates');
    const groupColIndex = header.indexOf('sharedToGroup');
    const errorIndexForRole = 'Row' + String(rowIndex + 1) + 'Col' + String(roleColIndex + 1);
    const errorIndexForRoleAndSubordinates =
      'Row' + String(rowIndex + 1) + 'Col' + String(roleAndSubordinatesColIndex + 1);
    const errorIndexForGroup = 'Row' + String(rowIndex + 1) + 'Col' + String(groupColIndex + 1);

    // when tags of filters are not found
    /*
    if (!Object.keys(row).includes('shredToRole')) {
      this.pushValidationResult(errorIndexForRole, messages.getMessage('validation.no.sharedtorole'));
    }
    if (!Object.keys(row).includes('sharedToRoleAndSubordinates')) {
      this.pushValidationResult(
        errorIndexForRoleAndSubordinates,
        messages.getMessage('validation.no.sharedtoroleandsubordinates')
      );
    }
    if (!Object.keys(row).includes('sharedToGroup')) {
      this.pushValidationResult(errorIndexForGroup, messages.getMessage('validation.no.sharedtogroup'));
    }*/

    const roles = row.sharedToRole;
    const roleAndSubordinates = row.sharedToRoleAndSubordinates;
    const groups = row.sharedToGroup;
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;

    // for role tag
    if (Array.isArray(roles !== undefined)) {
      roles.forEach((role: string) => {
        if (!regExpForSnakeCase.test(role)) {
          this.pushValidationResult(errorIndexForRole, messages.getMessage('validation.sharedtorole.format'));
        }
        if (role.split('__').length > 2) {
          this.pushValidationResult(errorIndexForRole, messages.getMessage('validation.sharedtorole.underscore'));
        }
        if (role.length === 0) {
          this.pushValidationResult(errorIndexForRole, messages.getMessage('validation.sharedtorole.blank'));
        }
        if (role.length > 80) {
          this.pushValidationResult(errorIndexForRole, messages.getMessage('validation.sharedtorole.length'));
        }
      });
    }

    // for roleAndSubordinates tag
    if (Array.isArray(roleAndSubordinates)) {
      roleAndSubordinates.forEach((roleAndSubordinate: string) => {
        if (!regExpForSnakeCase.test(roleAndSubordinate)) {
          this.pushValidationResult(
            errorIndexForRoleAndSubordinates,
            messages.getMessage('validation.sharedtoroleandsubordinates.format')
          );
        }
        if (roleAndSubordinate.split('__').length > 2) {
          this.pushValidationResult(
            errorIndexForRoleAndSubordinates,
            messages.getMessage('validation.sharedtoroleandsubordinates.underscore')
          );
        }
        if (roleAndSubordinate.length === 0) {
          this.pushValidationResult(
            errorIndexForRoleAndSubordinates,
            messages.getMessage('validation.sharedtoroleandsubordinates.blank')
          );
        }
        if (roleAndSubordinate.length > 80) {
          this.pushValidationResult(
            errorIndexForRoleAndSubordinates,
            messages.getMessage('validation.sharedtoroleandsubordinates.length')
          );
        }
      });
    }

    // for group tag
    if (Array.isArray(groups)) {
      groups.forEach((group: string) => {
        if (!regExpForSnakeCase.test(group)) {
          this.pushValidationResult(errorIndexForGroup, messages.getMessage('validation.sharedtogroup.format'));
        }
        if (group.split('__').length > 2) {
          this.pushValidationResult(errorIndexForGroup, messages.getMessage('validation.sharedtogroup.underscore'));
        }
        if (group.length === 0) {
          this.pushValidationResult(errorIndexForGroup, messages.getMessage('validation.sharedtogroup.blank'));
        }
        if (group.length > 40) {
          this.pushValidationResult(errorIndexForGroup, messages.getMessage('validation.sharedtogroup.length'));
        }
      });
    }

    return validationResLenBefore === Generate.validationResults.length;
  }

  private pushValidationResult(index: string, errorMessage: string): void {
    Generate.validationResults.push({ INDEX: index, PROBLEM: errorMessage });
  }

  private isValidLengthForFilter(fullNames: string[]): boolean {
    let isValidLength = true;
    for (const fullName of fullNames) {
      const isCustomField = fullName.endsWith('__c');
      if (isCustomField) {
        isValidLength = fullName.length <= 43 && isValidLength;
      } else {
        isValidLength = fullName.length <= 40 && isValidLength;
      }
    }
    return isValidLength;
  }

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
      columnsdelimiter: string;
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
          join(flags.outputdir, fullName + Generate.listviewExtension),
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
