/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { statSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname, parse } from 'path';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'tab.convert');

export type TabConvertResult = {
  csvDataStr: string;
};

export default class Convert extends SfCommand<TabConvertResult> {
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
  };

  private static header = ConfigData.tabConvertConfig.header;
  private static metaSettings = ConfigData.tabConvertConfig.metaSettings as { [key: string]: string };
  private static tabExtension = ConfigData.tabConvertConfig.tabExtension;

  public async run(): Promise<TabConvertResult> {
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
      const fullName = this.getFullNameFromPath(file);
      if (fullName === '') {
        return;
      }

      const metaXml = readFileSync(join(flags.sourcedir, file), { encoding: 'utf8' });
      parser.parseString(metaXml, (err, metaJson) => {
        if (err) {
          console.log(err.message);
        } else {
          if (!Object.keys(metaJson).includes('CustomTab')) {
            return;
          }
          const row = [...Array(Convert.header.length)].map((elm, idx) => {
            if (Convert.header[idx] === 'type') {
              const typeTag = Object.keys(Convert.metaSettings).filter((tag) => {
                console.log(Object.keys(metaJson.CustomTab));
                console.log(tag);
                return Object.keys(metaJson.CustomTab).includes(tag);
              })[0];
              console.log(typeTag);
              return Convert.metaSettings[typeTag];
            } else {
              return Object.keys(metaJson.CustomTab).includes(Convert.header[idx])
                ? this.convertSpecialChars(metaJson.CustomTab[Convert.header[idx]][0])
                : '';
            }
          });
          row[Convert.header.indexOf('fullName')] = fullName;
          csvList.push(row);
        }
      });
    });
    const csvStr = csvList.join('\n');
    writeFileSync(join(flags.outputdir, 'tab-meta.csv'), csvStr, 'utf8');

    return {
      csvDataStr: csvStr,
    };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Convert.tabExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    console.log(parse(path).base);
    return parse(path).base.replace(Convert.tabExtension, '');
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
