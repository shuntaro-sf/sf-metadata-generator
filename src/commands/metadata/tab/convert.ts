/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { statSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname, parse } from 'path';
import { Parser } from '@json2csv/plainjs';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import { TabConvert } from '../../../utils/tabConvert';
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
  private static tabExtension = ConfigData.tabConvertConfig.tabExtension;
  private static metaJson = [] as Array<{ [key: string]: any }>;

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
          const tabConverter = new TabConvert();
          Convert.metaJson.push(tabConverter.convert(metaJson.CustomTab, fullName));
        }
      });
    });

    let csvStr = '';
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, 'tab-meta.csv'), csvStr, 'utf8');
    }
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
    return parse(path).base.replace(Convert.tabExtension, '');
  }
}
