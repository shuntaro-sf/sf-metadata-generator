/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { statSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'field.convert');

export type FieldConvertResult = {
  csvDataStr: string;
};

export default class Convert extends SfCommand<FieldConvertResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    sourcedir: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.sourcedir.summary'),
    }),
    outputdir: Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.outputdir.summary'),
      default: './',
    }),
    picklistdelimiter: Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.picklistdelimiter.summary'),
      default: ConfigData.fieldGenerateConfig.picklistDelimiter,
    }),
  };

  private static header = ConfigData.fieldConvertConfig.header;

  public async run(): Promise<FieldConvertResult> {
    const { flags } = await this.parse(Convert);

    if (flags.sourcedir === undefined || !existsSync(flags.sourcedir)) {
      throw new SfError(messages.getMessage('error.path.source') + flags.sourcedir);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }

    const parser = new xml2js.Parser();
    const filesInSourcedir = readdirSync(flags.sourcedir);

    const csvList = [] as string[][];
    csvList[0] = Convert.header;
    filesInSourcedir.forEach((file) => {
      if (
        flags.sourcedir === undefined ||
        statSync(join(flags.sourcedir, file)).isDirectory() ||
        extname(join(flags.sourcedir, file)) !== '.xml'
      ) {
        return;
      }
      const metaXml = readFileSync(join(flags.sourcedir, file), { encoding: 'utf8' });
      parser.parseString(metaXml, (err, metaJson) => {
        if (err) {
          console.log(err.message);
        } else {
          if (!Object.keys(metaJson).includes('CustomField')) {
            return;
          }
          const row = [...Array(Convert.header.length)].map((elm, idx) => {
            if (Convert.header[idx] === 'picklistFullName' || Convert.header[idx] === 'picklistLabel') {
              return this.getValueForPicklist(metaJson, idx, flags);
            } else if (
              Convert.header[idx] === 'summaryFilterItemsField' ||
              Convert.header[idx] === 'summaryFilterItemsOperation' ||
              Convert.header[idx] === 'summaryFilterItemsValue'
            ) {
              return this.getValueForSummaryFilterItems(metaJson, idx);
            } else {
              return Object.keys(metaJson.CustomField).includes(Convert.header[idx])
                ? this.convertSpecialChars(metaJson.CustomField[Convert.header[idx]][0])
                : '';
            }
          });
          csvList.push(row);
        }
      });
    });
    const csvStr = csvList.join('\n');
    writeFileSync(join(flags.outputdir, 'field-meta.csv'), csvStr, 'utf8');

    return {
      csvDataStr: csvStr,
    };
  }

  private getValueForPicklist(
    metaJson: { [key: string]: any },
    colIndex: number,
    flags: { sourcedir: string | undefined; outputdir: string; picklistdelimiter: string } & { [flag: string]: any } & {
      json: boolean | undefined;
    }
  ): string {
    if (!Object.keys(metaJson.CustomField).includes('valueSet')) {
      return '';
    }
    const valueSetElm = metaJson.CustomField.valueSet[0];
    const valueSetDefinitionElm = valueSetElm.valueSetDefinition[0];
    const valueElms = valueSetDefinitionElm.value as Array<{
      [key: string]: string;
    }>;
    const tag =
      Convert.header[colIndex].replace('picklist', '').substring(0, 1).toLocaleLowerCase() +
      Convert.header[colIndex].replace('picklist', '').substring(1);
    return valueElms.map((picklistElm) => picklistElm[tag]).join(flags.picklistdelimiter);
  }

  private getValueForSummaryFilterItems(metaJson: { [key: string]: any }, colIndex: number): string {
    if (!Object.keys(metaJson.CustomField).includes('summaryFilterItems')) {
      return '';
    }
    const summaryFIlterItemsElm = metaJson.CustomField.summaryFilterItems[0] as { [key: string]: string };
    const tag =
      Convert.header[colIndex].replace('summaryFilterItems', '').substring(0, 1).toLocaleLowerCase() +
      Convert.header[colIndex].replace('summaryFilterItems', '').substring(1);
    return summaryFIlterItemsElm[tag];
  }

  private convertSpecialChars(str: string): string {
    str = str.replace(/&amp;/g, '&');
    str = str.replace(/&lt;/g, '<');
    str = str.replace(/&gt;/g, '>');
    str = str.replace(/&quot;/g, '"');
    str = str.replace(/&#x27;/g, "'");
    str = str.replace(/&#x60;/g, '`');
    return str;
  }
}
