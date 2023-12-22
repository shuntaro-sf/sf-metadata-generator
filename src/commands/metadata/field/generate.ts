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
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'field.generate');

export type FieldGenerateResult = {
  MetaJson: Json;
};

export default class Generate extends SfCommand<FieldGenerateResult> {
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
      default: ConfigData.fieldGenerateConfig.delimiter,
    }),
    picklistdelimiter: Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.picklistdelimiter.summary'),
      default: ConfigData.fieldGenerateConfig.picklistDelimiter,
    }),
  };

  private static xmlSetting = ConfigData.fieldGenerateConfig.xmlSetting as { [key: string]: string };
  private static defaultValues = ConfigData.fieldGenerateConfig.defaultValues as Json;
  private static valueSetDefaultValues = ConfigData.fieldGenerateConfig.valueSetDefaultValues as Json;
  private static summaryFilterItemsDefaultValues = ConfigData.fieldGenerateConfig
    .summaryFilterItemsDefaultValues as Json;
  private static isRequired = ConfigData.fieldGenerateConfig.isRequired as Json;
  private static options = ConfigData.fieldGenerateConfig.options as Json;
  private static indentationLength = ConfigData.fieldGenerateConfig.indentationLength;
  private static fieldExtension = ConfigData.fieldGenerateConfig.fieldExtension;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static failureResults = [] as Array<{ [key: string]: string }>;
  private static metaXmls = {} as { [key: string]: string };
  private static metaJson = {} as { [key: string]: any };

  public async run(): Promise<FieldGenerateResult> {
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
        this.getSummaryFilterItemsMetaStr(row, rowIndex);
      }
      // formula//
      if (Object.keys(row).includes('formula') && row.formula !== '') {
        this.formatRowForFormula(row);
      }

      Generate.successResults.push({
        FULLNAME: row.fullName + '.' + Generate.fieldExtension,
        PATH: join(flags.outputdir, row.fullName + '.' + Generate.fieldExtension).replace('//', '/'),
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
      Generate.metaJson[row.fullName] = { CustomField: row };
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
    const valueSetDefinitionElm = Generate.valueSetDefaultValues.valueSetDefinition;
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

  private getSummaryFilterItemsMetaStr(row: { [key: string]: any }, rowIndex: number): void {
    // when there are no summaryFilterItems columns
    const noSummaryFilterItemsColumns =
      !Object.keys(row).includes('summaryFilterItemsField') &&
      !Object.keys(row).includes('summaryFilterItemsOperation') &&
      !Object.keys(row).includes('summaryFilterItemsValue');
    const noSummaryFilterItemsInputs =
      row.summaryFilterItemsField === '' &&
      row.summaryFilterItemsOperation === '' &&
      row.summaryFilterItemsValue === '';
    if (noSummaryFilterItemsColumns || noSummaryFilterItemsInputs) {
      delete row.summaryFilterItemsField;
      delete row.summaryFilterItemsOperation;
      delete row.summaryFilterItemsValue;
      return;
    }
    if (!this.isValidInputsForSummaryFilterItems(row, rowIndex)) {
      return;
    }
    const summaryFilterItemsElm = { ...Generate.summaryFilterItemsDefaultValues };
    Object.keys(summaryFilterItemsElm).forEach((tag) => {
      const tagForRow = 'summaryFilterItems' + tag.substring(0, 1).toUpperCase() + tag.substring(1);
      if (Object.keys(row).includes(tagForRow)) {
        summaryFilterItemsElm[tag] = row[tagForRow];
      }
    });

    row['summaryFilterItems'] = summaryFilterItemsElm;
    delete row.summaryFilterItemsField;
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
    const regExpForOneChar = /^[a-zA-Z]/;
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;
    const errorIndex = 'Row' + String(rowIndex + 1) + 'Col' + String(colIndex + 1);
    const header = Object.keys(row);
    const rowList = Object.values(row);
    switch (tag) {
      case 'fullName':
        this.validatesFullName(regExpForSnakeCase, rowList, colIndex, errorIndex);
        break;
      case 'externalId':
        this.validatesExternalId(row.type, rowList, colIndex, errorIndex);
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
      case 'required':
        this.validatesRequired(rowList, colIndex, errorIndex);
        break;
      case 'formula':
        this.validatesFormula(row.type, rowList, colIndex, errorIndex);
        break;
      case 'trackHistory':
        this.validatesTrackHistory(rowList, colIndex, errorIndex);
        break;
      case 'trackTrending':
        this.validatesTrackTrending(rowList, colIndex, errorIndex);
        break;
      case 'unique':
        this.validatesUnique(rowList, colIndex, errorIndex);
        break;
      case 'defaultValue':
        this.validatesDefaultValue(row.type, rowList, colIndex, errorIndex);
        break;
      case 'displayFormat':
        this.validatesDisplayFormat(rowList, colIndex, row.type, errorIndex);
        break;
      case 'displayLocationInDecimal':
        this.validatesDisplayLocationInDecimal(row.type, rowList, colIndex, errorIndex);
        break;
      case 'scale':
        this.validatesScale(header, row.type, rowList, colIndex, errorIndex);
        break;
      case 'precision':
        this.validatesPrecision(header, row.type, rowList, colIndex, errorIndex);
        break;
      case 'visibleLines':
        this.validatesVisibleLines(row.type, rowList, colIndex, errorIndex);
        break;
      case 'length':
        this.validatesLength(row.type, rowList, colIndex, errorIndex);
        break;
      case 'maskChar':
        this.validatesMaskChar(row.type, rowList, colIndex, errorIndex);
        break;
      case 'maskrow.type':
        this.validatesMaskType(row.type, rowList, colIndex, errorIndex);
        break;
      case 'caseSensitive':
        this.validatesCaseSensitive(header, row.type, rowList, colIndex, errorIndex);
        break;
      case 'formulaTreatBlanksAs':
        this.validatesFormulaTreatBlankAs(header, row.type, rowList, colIndex, errorIndex);
        break;
      case 'referenceTo':
        this.validatesReferenceTo(row.type, rowList, colIndex, regExpForSnakeCase, regExpForOneChar, errorIndex);
        break;
      case 'relationshipName':
        this.validatesRelationshipName(row.type, rowList, colIndex, regExpForSnakeCase, regExpForOneChar, errorIndex);
        break;
      case 'relationshipLabel':
        this.validatesRelationshipLabel(row.type, rowList, colIndex, errorIndex);
        break;
      case 'relationshipOrder':
        this.validatesRelationshipOrder(row.type, rowList, colIndex, errorIndex);
        break;
      case 'deleteConstraint':
        this.validatesDeleteConstraint(row.type, rowList, colIndex, errorIndex);
        break;
      case 'reparentableMasterDetail':
        this.validatesReparentableMasterDetail(row.type, rowList, colIndex, errorIndex);
        break;
      case 'writeRequiresMasterRead':
        this.validatesWriteRequiresMasterRead(row.type, rowList, colIndex, errorIndex);
        break;
      case 'summarizedField':
        this.validatesSummarizedField(header, row.type, rowList, colIndex, errorIndex, regExpForSnakeCase);
        break;
      case 'summaryForeignKey':
        this.validatesSummaryForeignKey(row.type, rowList, colIndex, errorIndex, regExpForSnakeCase);
        break;
      case 'summaryOperation':
        this.validatesSummaryOperation(row.type, rowList, colIndex, errorIndex);
        break;
    }
    return validationResLenBefore === Generate.validationResults.length;
  }

  private validatesSummaryOperation(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'Summary' && row[indexOfTag] !== '') {
      if (!Generate.options.summaryOperation.includes(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.summaryoperation.options') + Generate.options.summaryOperation.toString()
        );
      }
    }
  }

  private validatesSummarizedField(
    header: string[],
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForSnakeCase: RegExp
  ): void {
    const indexOfSummaryOperation = header.indexOf('summaryOperation');
    if (type === 'Summary' && indexOfSummaryOperation !== -1 && row[indexOfSummaryOperation] !== '') {
      const fullNameSplit = row[indexOfTag].split('.');
      if (
        row[indexOfTag] === '' &&
        row[indexOfSummaryOperation] !== 'count' &&
        Generate.options.summaryOperation.includes(row[indexOfSummaryOperation])
      ) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.summarizedfield.no.summaryoperation'));
      }
      if (fullNameSplit.length !== 2) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.summarizedfield.invalid.reference'));
      } else {
        if (!regExpForSnakeCase.test(fullNameSplit[0]) || !regExpForSnakeCase.test(fullNameSplit[1])) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summarizedfield.format'));
        }
        if (fullNameSplit[0].split('__').length > 2 || fullNameSplit[1].split('__').length > 2) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summarizedfield.underscore'));
        }
        if (fullNameSplit[0].length === 0 || fullNameSplit[1].length === 0) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summarizedfield.blank'));
        }
        if (!this.isValidLengthForSummary(fullNameSplit)) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summarizedfield.length'));
        }
      }
    }
  }

  private validatesSummaryForeignKey(
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForSnakeCase: RegExp
  ): void {
    if (type === 'Summary') {
      const fullNameSplit = row[indexOfTag].split('.');
      if (fullNameSplit.length !== 2) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.summaryforeignkey.invalid.reference'));
      } else {
        if (!regExpForSnakeCase.test(fullNameSplit[0]) || !regExpForSnakeCase.test(fullNameSplit[1])) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summaryforeignkey.format'));
        }
        if (fullNameSplit[0].split('__').length > 2 || fullNameSplit[1].split('__').length > 2) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summaryforeignkey.underscore'));
        }
        if (fullNameSplit[0].length === 0 || fullNameSplit[0].length === 0) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summaryforeignkey.blank'));
        }
        if (!this.isValidLengthForSummary(fullNameSplit)) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.summaryforeignkey.length'));
        }
      }
    }
  }

  private validatesWriteRequiresMasterRead(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'MasterDetail' && row[indexOfTag] !== '') {
      if (!Generate.options.writeRequiresMasterRead.includes(row[indexOfTag].toLowerCase())) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.writerequiresmasterread.options'));
      }
    }
  }

  private validatesRelationshipOrder(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'MasterDetail' && row[indexOfTag] !== '') {
      if (!Generate.options.relationshipOrder.includes(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.relationshiporder.options') + Generate.options.relationshipOrder.toString()
        );
      }
    }
  }

  private validatesRelationshipLabel(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if ((type === 'Lookup' || type === 'MasterDetail' || type === 'ExternalLookup') && row[indexOfTag] !== '') {
      if (row[indexOfTag].length > 80) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.relationshiplabel.length'));
      }
    }
  }

  private validatesRelationshipName(
    type: string,
    row: string[],
    indexOfTag: number,
    regExpForSnakeCase: RegExp,
    regExpForOneChar: RegExp,
    errorIndex: string
  ): void {
    if ((type === 'Lookup' || type === 'MasterDetail' || type === 'ExternalLookup') && row[indexOfTag] !== '') {
      const isCustomField = row[indexOfTag].endsWith('__c');
      if (
        (row[indexOfTag].length > 1 && !regExpForSnakeCase.test(row[indexOfTag])) ||
        (row[indexOfTag].length === 1 && !regExpForOneChar.test(row[indexOfTag]))
      ) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.relationshipname.format'));
      }
      if (
        (!isCustomField && row[indexOfTag].split('__').length > 1) ||
        (isCustomField && row[indexOfTag].split('__').length > 2)
      ) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.relationshipname.underscore'));
      }
      if (row[indexOfTag].length === 0) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.relationshipname.blank'));
      }
      if (row[indexOfTag].length > 40) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.relationshipname.length'));
      }
    }
  }

  private validatesReparentableMasterDetail(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'MasterDetail' && row[indexOfTag] !== '') {
      if (!Generate.options.reparentableMasterDetail.includes(row[indexOfTag].toLowerCase())) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.reparentablemasterdetail.options'));
      }
    }
  }

  private validatesDeleteConstraint(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'Lookup' && row[indexOfTag] !== '') {
      if (!Generate.options.deleteConstraint.includes(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.deleteconstraint.options') + Generate.options.deleteConstraint.toString()
        );
      }
    }
  }

  private validatesReferenceTo(
    type: string,
    row: string[],
    indexOfTag: number,
    regExpForSnakeCase: RegExp,
    regExpForOneChar: RegExp,
    errorIndex: string
  ): void {
    if ((type === 'Lookup' || type === 'MasterDetail' || type === 'ExternalLookup') && row[indexOfTag] !== '') {
      const isCustomField = row[indexOfTag].endsWith('__c');
      if (
        (row[indexOfTag].length > 1 && !regExpForSnakeCase.test(row[indexOfTag])) ||
        (row[indexOfTag].length === 1 && !regExpForOneChar.test(row[indexOfTag]))
      ) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.referenceto.format'));
      }
      if (
        (!isCustomField && row[indexOfTag].split('__').length > 1) ||
        (isCustomField && row[indexOfTag].split('__').length > 2)
      ) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.referenceto.underscore'));
      }
      if (row[indexOfTag].length === 0) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.referenceto.blank'));
      }
      if ((!isCustomField && row[indexOfTag].length > 40) || (isCustomField && row[indexOfTag].length > 43)) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.referenceto.length'));
      }
    }
  }

  private validatesVisibleLines(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if ((type === 'MultiselectPicklist' || type === 'LongTextArea' || type === 'Html') && row[indexOfTag] !== '') {
      if (!Number.isInteger(Number(row[indexOfTag]))) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.type'));
      }
    }
    if (type === 'LongTextArea' && row[indexOfTag] !== '') {
      if (Number(row[indexOfTag]) < 2) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.longtext.min'));
      }
      if (Number(row[indexOfTag]) > 50) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.longtext.max'));
      }
    }
    if (type === 'Html' && row[indexOfTag] !== '') {
      if (Number(row[indexOfTag]) < 10) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.html.min'));
      }
      if (Number(row[indexOfTag]) > 50) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.longtext.max'));
      }
    }
    if (type === 'MultiselectPicklist' && row[indexOfTag] !== '') {
      if (Number(row[indexOfTag]) < 3) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.picklist.min'));
      }
      if (Number(row[indexOfTag]) > 10) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.visiblelines.picklist.max'));
      }
    }
  }

  // eslint-disable-next-line complexity
  private validatesLength(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (
      (type === 'Text' ||
        type === 'LongTextArea' ||
        type === 'Html' ||
        type === 'EncryptedText' ||
        type === 'ExternalLookup') &&
      row[indexOfTag] !== ''
    ) {
      if (!Number.isInteger(Number(row[indexOfTag]))) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.type'));
      }
    }
    if ((type === 'Text' || type === 'ExternalLookup') && row[indexOfTag] !== '') {
      if (Number(row[indexOfTag]) < 1) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.text.min'));
      }
      if (Number(row[indexOfTag]) > 255) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.text.max'));
      }
    }
    if ((type === 'LongTextArea' || type === 'Html') && row[indexOfTag] !== '') {
      if (Number(row[indexOfTag]) < 256) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.longtext.min'));
      }
      if (Number(row[indexOfTag]) > 131072) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.longtext.max'));
      }
    }
    if (type === 'EncryptedText' && row[indexOfTag] !== '') {
      if (Number(row[indexOfTag]) < 1) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.text.min'));
      }
      if (Number(row[indexOfTag]) > 175) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.length.encryptedtext.max'));
      }
    }
  }

  private validatesMaskChar(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'EncryptedText' && row[indexOfTag] !== '') {
      if (!Generate.options.maskChar.includes(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.maskchar.options'));
      }
    }
  }

  private validatesMaskType(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'EncryptedText' && row[indexOfTag] !== '') {
      if (!Generate.options.maskType.includes(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.masktype.options') + Generate.options.maskType.toString()
        );
      }
    }
  }

  private validatesCaseSensitive(
    header: string[],
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string
  ): void {
    const indexOfUnique = header.indexOf('unique');
    if (type === 'Text' && row[indexOfTag] !== '') {
      if (indexOfUnique === -1) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.no.unique'));
      } else if (!Generate.options.caseSensitive.includes(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.casesensitive.options'));
      }
    }
  }

  private validatesFormulaTreatBlankAs(
    header: string[],
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string
  ): void {
    const indexOfFormula = header.indexOf('formula');
    if (
      (type === 'Checkbox' ||
        type === 'Currency' ||
        type === 'Date' ||
        type === 'DateTime' ||
        type === 'Number' ||
        type === 'Percent' ||
        type === 'Text' ||
        type === 'Time') &&
      row[indexOfTag] !== ''
    ) {
      if (indexOfFormula === -1) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.no.formula'));
      } else if (!Generate.options.formulaTreatBlanksAs.includes(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.formula.treatblanksas.options') +
            Generate.options.formulaTreatBlanksAs.toString()
        );
      }
    }
  }

  private validatesPrecision(
    header: string[],
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string
  ): void {
    const indexOfScale = header.indexOf('scale');
    if ((type === 'Number' || type === 'Percent' || type === 'Currency') && row[indexOfTag] !== '') {
      if (!Number.isInteger(Number(row[indexOfTag]))) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.precision.type'));
      }
      if (Number(row[indexOfTag]) < 0) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.precision.negative'));
      }
      if (indexOfScale === -1) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.no.precision'));
      } else {
        if (!Number.isInteger(Number(row[indexOfScale]))) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.scale.type'));
        }
        if (Number(row[indexOfScale]) + Number(row[indexOfTag]) > 18) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.precision.sum'));
        }
        if (Number(row[indexOfScale]) >= 8) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.precision.comarison.scale'));
        }
      }
    }
  }

  private validatesScale(header: string[], type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    const indexOfPrecision = header.indexOf('precision');
    if (
      (type === 'Number' || type === 'Percent' || type === 'Currency' || type === 'Location') &&
      row[indexOfTag] !== ''
    ) {
      if (!Number.isInteger(Number(row[indexOfTag]))) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.scale.type'));
      }
      if (Number(row[indexOfTag]) < 0) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.scale.negative'));
      }
      if (Number(row[indexOfTag]) >= 8) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.scale.comarison.precision'));
      }
      if (indexOfPrecision === -1) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.no.precision'));
      } else {
        if (!Number.isInteger(Number(row[indexOfPrecision]))) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.precision.type'));
        }
        if (Number(row[indexOfTag]) + Number(row[indexOfPrecision]) > 18) {
          this.pushValidationResult(errorIndex, messages.getMessage('validation.scale.sum'));
        }
      }
    }
  }

  private validatesDisplayLocationInDecimal(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'Location' && row[indexOfTag] !== '') {
      if (!Generate.options.displayLocationInDecimal.includes(row[indexOfTag].toLowerCase())) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.displaylocationindecimal.options'));
      }
    }
  }

  private validatesDisplayFormat(row: string[], indexOfTag: number, type: string, errorIndex: string): void {
    const invalidChars = ['"', "'", '&', '<', '>', ';', ':', '\\'];
    const regExpInvalidChars = new RegExp('[' + invalidChars.join('').replace('\\', '\\\\') + ']+');
    const regExpNumber = /{(0+)}/;
    const formatNumber = row[indexOfTag].match(regExpNumber);
    if (type === 'AutoNumber' && row[indexOfTag] !== '') {
      if (regExpInvalidChars.test(row[indexOfTag])) {
        this.pushValidationResult(
          errorIndex,
          messages.getMessage('validation.displayformat.invalid.char') + invalidChars.toString()
        );
      }
      if (formatNumber === null) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.displayformat.format'));
      } else if (formatNumber[1].length > 10) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.displayformat.digits'));
      }
      if (row[indexOfTag].length > 30) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.displayformat.length'));
      }
    }
  }

  private validatesRequired(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.required.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.required.options'));
    }
  }

  private validatesFormula(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (
      (type === 'Checkbox' ||
        type === 'Currency' ||
        type === 'Date' ||
        type === 'DateTime' ||
        type === 'Number' ||
        type === 'Percent' ||
        type === 'Text' ||
        type === 'Time') &&
      row[indexOfTag] !== ''
    ) {
      if (row[indexOfTag].length > 3900) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.formula.length'));
      }
    }
  }

  private validatesTrackHistory(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.trackTrending.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.trackhistory.options'));
    }
  }

  private validatesTrackTrending(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.trackTrending.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.tracktrending.options'));
    }
  }

  private validatesUnique(row: string[], indexOfTag: number, errorIndex: string): void {
    if (!Generate.options.unique.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.unique.options'));
    }
  }

  private validatesDefaultValue(
    type: string,
    row: string[],
    indexOfTag: number,

    errorIndex: string
  ): void {
    if (type === 'Checkbox' && row[indexOfTag] !== '') {
      if (!Generate.options.defaultValue.includes(row[indexOfTag].toLowerCase())) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.defaultvalue.options'));
      }
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

  private validatesExternalId(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if ((type === 'Number' || type === 'Email' || type === 'Text') && row[indexOfTag] !== '') {
      if (!Generate.options.externalId.includes(row[indexOfTag].toLowerCase())) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.externalid.options'));
      }
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

  private isValidInputsForSummaryFilterItems(row: { [key: string]: string }, rowIndex: number): boolean {
    const header = Object.keys(row);
    const validationResLenBefore = Generate.validationResults.length;
    const fieldColIndex = header.indexOf('summaryFilterItemsField');
    const operationColIndex = header.indexOf('summaryFilterItemsOperation');
    const valueColIndex = header.indexOf('summaryFilterItemsValue');
    const errorIndexForField = 'Row' + String(rowIndex + 1) + 'Col' + String(fieldColIndex + 1);
    const errorIndexForOperation = 'Row' + String(rowIndex + 1) + 'Col' + String(operationColIndex + 1);
    const errorIndexForValue = 'Row' + String(rowIndex + 1) + 'Col' + String(valueColIndex + 1);

    // when tags of summaryFilterItems are not found
    if (!Object.keys(row).includes('summaryFilterItemsField')) {
      this.pushValidationResult(errorIndexForField, messages.getMessage('validation.no.summaryfilteritemsfield'));
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
    const field = row.summaryFilterItemsField;
    const operation = row.summaryFilterItemsOperation;
    const value = row.summaryFilterItemsValue;

    // for field tag
    const fullNameSplit = field.split('.');
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;

    if (fullNameSplit.length !== 2) {
      this.pushValidationResult(
        errorIndexForField,
        messages.getMessage('validation.summarizedfield.invalid.reference')
      );
    } else {
      if (!regExpForSnakeCase.test(fullNameSplit[0]) || !regExpForSnakeCase.test(fullNameSplit[1])) {
        this.pushValidationResult(errorIndexForField, messages.getMessage('validation.summaryfilteritemsfield.format'));
      }
      if (fullNameSplit[0].split('__').length > 2 || fullNameSplit[1].split('__').length > 2) {
        this.pushValidationResult(
          errorIndexForField,
          messages.getMessage('validation.summaryfilteritemsfield.underscore')
        );
      }
      if (fullNameSplit[0].length === 0 || fullNameSplit[1].length === 0) {
        this.pushValidationResult(errorIndexForField, messages.getMessage('validation.summaryfilteritemsfield.blank'));
      }
      if (!this.isValidLengthForSummary(fullNameSplit)) {
        this.pushValidationResult(errorIndexForField, messages.getMessage('validation.summaryfilteritemsfield.length'));
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
  }

  private pushValidationResult(index: string, errorMessage: string): void {
    Generate.validationResults.push({ INDEX: index, PROBLEM: errorMessage });
  }

  private isValidLengthForSummary(fullNames: string[]): boolean {
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
      picklistdelimiter: string;
    } & { [flag: string]: any } & { json: boolean | undefined }
  ): void {
    const blue = '\u001b[34m';
    const white = '\u001b[37m';
    this.log('===' + blue + ' Generated Source' + white);
    this.logTable(Generate.successResults);
    Object.keys(Generate.metaXmls).forEach((fullName) => {
      if (
        (!flags.updates && !existsSync(join(flags.outputdir, fullName + '.' + Generate.fieldExtension))) ||
        flags.updates
      ) {
        // for creating
        writeFileSync(
          join(flags.outputdir, fullName + '.' + Generate.fieldExtension),
          Generate.metaXmls[fullName],
          'utf8'
        );
      } else {
        // when fail to save
        Generate.failureResults.push({
          FILENAME: fullName + '.' + Generate.fieldExtension,
          MESSAGE:
            'Failed to save ' + fullName + '.' + Generate.fieldExtension + '. ' + messages.getMessage('failureSave'),
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
