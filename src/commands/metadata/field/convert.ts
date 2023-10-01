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

import { FieldConvert } from '../../../utils/fieldConvert';
import { Json } from '../../../utils/type';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'field.convert');

export type FieldConvertResult = {
  MetaJson: Json;
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
          this.log(err.message);
        } else {
          if (!Object.keys(metaJson).includes('CustomField')) {
            return;
          }
          const fieldConverter = new FieldConvert();
          Convert.metaJson.push(fieldConverter.convert(metaJson.CustomField, flags.picklistdelimiter));
        }
      });
    });
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      const csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, 'field-meta.csv'), csvStr, 'utf8');
    }
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return {
      MetaJson: Convert.metaJson,
    };
  }
}
