/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

import { ListviewConvert } from '../../../utils/listviewConvert';
import { Json } from '../../../utils/type';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'listview.convert');

export type listviewConvertResult = {
  MetaJson: Json;
};

export default class Convert extends SfCommand<listviewConvertResult> {
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
    columnsdelimiter: Flags.string({
      char: 'c',
      summary: messages.getMessage('flags.columnsdelimiter.summary'),
      default: ConfigData.listviewConvertConfig.columnsDelimiter,
    }),
  };

  private static header = ConfigData.listviewConvertConfig.header;
  private static csvExtension = ConfigData.permissionsetConvertConfig.csvExtension;
  private static metaJson = [] as Array<{ [key: string]: any }>;

  public async run(): Promise<listviewConvertResult> {
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
          this.log(err.message);
        } else {
          if (!Object.keys(metaJson).includes('ListView')) {
            return;
          }
          const listviewConverter = new ListviewConvert();
          Convert.metaJson.push(listviewConverter.convert(metaJson.ListView, flags.columnsdelimiter));
        }
      });
    });
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      const csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, Convert.csvExtension), csvStr, 'utf8');
    }
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return {
      MetaJson: Convert.metaJson,
    };
  }
}
