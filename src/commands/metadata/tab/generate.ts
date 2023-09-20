/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
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
export type MetaJson = { [key: string]: any | MetaJson };

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'tab.generate');

export type TabGenerateResult = {
  MetaJson: MetaJson;
};

export default class Generate extends SfCommand<TabGenerateResult> {
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
      default: ConfigData.tabGenerateConfig.delimiter,
    }),
  };

  private static xmlSetting = ConfigData.tabGenerateConfig.xmlSetting as { [key: string]: string };
  private static defaultValues = ConfigData.tabGenerateConfig.defaultValues as DefaultValues;
  private static isRequired = ConfigData.tabGenerateConfig.isRequired as IsRequired;
  private static options = ConfigData.tabGenerateConfig.options as Options;
  private static indentationLength = ConfigData.tabGenerateConfig.indentationLength;
  private static tabExtension = ConfigData.tabGenerateConfig.tabExtension;
  private static delimiter = ConfigData.tabGenerateConfig.delimiter;

  private static validationResults = [] as Array<{ [key: string]: string }>;
  private static successResults = [] as Array<{ [key: string]: string }>;
  private static failureResults = [] as Array<{ [key: string]: string }>;
  private static metaXmls = {} as { [key: string]: string };
  private static metaJson = {} as { [key: string]: any };

  public async run(): Promise<TabGenerateResult> {
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
        const colIndex = Object.keys(row).indexOf(tag);
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
        if (!this.isValidInputs(tag, row, rowIndex, colIndex)) {
          return;
        }
        this.log(row[tag]);
        row[tag] = this.convertSpecialChars(row[tag]);
      });
      // nameField
      // this.pushNameFieldMetaStr(row, rowIndex);

      // metaSettings
      // this.getMetaSettings(row);

      Generate.successResults.push({
        FULLNAME: row.fullName + Generate.tabExtension,
        PATH: join(flags.outputdir, row.fullName + Generate.tabExtension).replace('//', '/'),
      });

      removedKeys.forEach((key) => {
        delete row[key];
      });

      Object.keys(row).sort();
      row['$'] = { xmlns: Generate.xmlSetting.xmlns };
      Generate.metaJson[row.fullName] = { CustomField: row };
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

  // eslint-disable-next-line complexity
  private isValidInputs(tag: string, row: { [key: string]: string }, rowIndex: number, colIndex: number): boolean {
    const validationResLenBefore = Generate.validationResults.length;
    const regExpForSnakeCase = /^[a-zA-Z][0-9a-zA-Z_]+[a-zA-Z]$/;
    const regExpForMotif = /.+:\s.+/;
    const regExpForUrl = /^https:\/\//;
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
      case 'actionOverrides':
        break;
      case 'customObject':
        this.validatesCustomObject(row.type, rowList, colIndex, errorIndex);
        break;
      case 'flexiPage':
        this.validatesFlexiPage(row.type, rowList, colIndex, errorIndex, regExpForSnakeCase);
        break;
      case 'frameHeight':
        this.validatesFrameHeight(row.type, rowList, colIndex, errorIndex);
        break;
      case 'hasSidebar':
        this.validatesHasSidebar(row.type, rowList, colIndex, errorIndex);
        break;
      case 'lwcComponent':
        this.validatesLwcComponent(row.type, rowList, colIndex, errorIndex, regExpForSnakeCase);
        break;
      case 'motif':
        this.validatesMotif(rowList, colIndex, errorIndex, regExpForMotif);
        break;
      case 'Page':
        this.validatesPage(row.type, rowList, colIndex, errorIndex, regExpForSnakeCase);
        break;
      case 'splashPageLink':
        this.validatesSplashPageLink(rowList, colIndex, errorIndex, regExpForSnakeCase);
        break;
      case 'url':
        this.validatesUrl(row.type, rowList, colIndex, errorIndex, regExpForUrl);
        break;
    }
    return validationResLenBefore === Generate.validationResults.length;
  }
  private validatesPage(
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForSnakeCase: RegExp
  ): void {
    if (type === 'VisualforcePage' && row[indexOfTag] !== '') {
      if (!regExpForSnakeCase.test(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.page.format'));
      }
    }
  }

  private validatesUrl(
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForUrl: RegExp
  ): void {
    if (type === 'Web' && row[indexOfTag] !== '') {
      if (!regExpForUrl.test(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.url.format'));
      }
    }
  }
  private validatesSplashPageLink(
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForSnakeCase: RegExp
  ): void {
    if (row[indexOfTag] !== '') {
      if (!regExpForSnakeCase.test(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.splashpagelink.options'));
      }
    }
  }
  private validatesMotif(row: string[], indexOfTag: number, errorIndex: string, regExpForMotif: RegExp): void {
    if (!regExpForMotif.test(row[indexOfTag])) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.motif.format'));
    }
  }
  private validatesLwcComponent(
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForSnakeCase: RegExp
  ): void {
    if (type === 'LightningWebComponentPage' && row[indexOfTag] !== '') {
      if (!regExpForSnakeCase.test(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.lwccomponent.format'));
      }
    }
  }

  private validatesHasSidebar(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'Web' && row[indexOfTag] !== '') {
      if (!Generate.options.hasSidebar.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.hassidebar.options'));
      }
    }
  }
  private validatesFrameHeight(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'Web' && row[indexOfTag] !== '') {
      if (!Number.isInteger(Number(row[indexOfTag]))) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.frameheight.type'));
      }
      if (Number(row[indexOfTag]) < 0) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.frameheight.min'));
      }
      if (Number(row[indexOfTag]) >= 1000) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.frameheight.max'));
      }
    }
  }
  private validatesFlexiPage(
    type: string,
    row: string[],
    indexOfTag: number,
    errorIndex: string,
    regExpForSnakeCase: RegExp
  ): void {
    if (type === 'LightiningPage' && row[indexOfTag] !== '') {
      if (!regExpForSnakeCase.test(row[indexOfTag])) {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.flexipage.format'));
      }
    }
  }
  private validatesCustomObject(type: string, row: string[], indexOfTag: number, errorIndex: string): void {
    if (type === 'CustomObject' && row[indexOfTag] !== '') {
      if (!Generate.options.customObject.includes(row[indexOfTag].toLowerCase()) && row[indexOfTag] !== '') {
        this.pushValidationResult(errorIndex, messages.getMessage('validation.customobject.options'));
      }
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
    if (row[indexOfTag].split('__').length > 2) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.underscore'));
    }
    if (row[indexOfTag].length === 0) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.blank'));
    }
    if (row[indexOfTag].length > 40) {
      this.pushValidationResult(errorIndex, messages.getMessage('validation.fullname.length'));
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
      if ((!flags.updates && !existsSync(join(flags.outputdir, fullName + Generate.tabExtension))) || flags.updates) {
        // for creating
        writeFileSync(join(flags.outputdir, fullName + Generate.tabExtension), Generate.metaXmls[fullName], 'utf8');
      } else {
        // when fail to save
        Generate.failureResults.push({
          FILENAME: fullName + '.' + Generate.tabExtension,
          MESSAGE: 'Failed to save ' + fullName + Generate.tabExtension + '. ' + messages.getMessage('failureSave'),
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
