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
import { Parser } from '@json2csv/plainjs';
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
  private static metaJson = [] as Array<{ [key: string]: any }>;

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
          const row = {} as { [key: string]: any };
          if (!Object.keys(metaJson).includes('CustomField')) {
            return;
          }
          Convert.header.forEach((tag: string) => {
            if (tag === 'picklistFullName' || tag === 'picklistLabel') {
              row[tag] = this.getValueForPicklist(metaJson, tag, flags);
            } else if (
              tag === 'summaryFilterItemsField' ||
              tag === 'summaryFilterItemsOperation' ||
              tag === 'summaryFilterItemsValue'
            ) {
              row[tag] = this.getValueForSummaryFilterItems(metaJson, tag);
            } else {
              row[tag] = Object.keys(metaJson.CustomField).includes(tag) ? metaJson.CustomField[tag][0] : '';
            }
          });
          Convert.metaJson.push(row);
        }
      });
    });
    let csvStr = '';
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, 'field-meta.csv'), csvStr, 'utf8');
    }
    return {
      csvDataStr: csvStr,
    };
  }
  private getValueForPicklist(
    metaJson: { [key: string]: any },
    tag: string,
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
    const xmlTag =
      tag.replace('picklist', '').substring(0, 1).toLocaleLowerCase() + tag.replace('picklist', '').substring(1);
    return valueElms.map((picklistElm) => picklistElm[xmlTag]).join(flags.picklistdelimiter);
  }

  private getValueForSummaryFilterItems(metaJson: { [key: string]: any }, tag: string): string {
    if (!Object.keys(metaJson.CustomField).includes('summaryFilterItems')) {
      return '';
    }
    const summaryFIlterItemsElm = metaJson.CustomField.summaryFilterItems[0] as { [key: string]: string };
    const xmlTag =
      tag.replace('summaryFilterItems', '').substring(0, 1).toLocaleLowerCase() +
      tag.replace('summaryFilterItems', '').substring(1);
    return summaryFIlterItemsElm[xmlTag];
  }
}
