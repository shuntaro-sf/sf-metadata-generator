/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { statSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname, parse } from 'path';
import { Parser } from '@json2csv/plainjs';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import { Json } from '../../../utils/type';
import { ObjectConvert } from '../../../utils/objectConvert';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'object.convert');

export type ObjectConvertResult = {
  MetaJson: Json;
};

export default class Convert extends SfCommand<ObjectConvertResult> {
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

  private static header = ConfigData.objectConvertConfig.header;
  private static objectExtension = ConfigData.objectConvertConfig.objectExtension;
  private static metaJson = [] as Array<{ [key: string]: any }>;

  public async run(): Promise<ObjectConvertResult> {
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
          this.log(err.message);
        } else {
          if (!Object.keys(metaJson).includes('CustomObject')) {
            return;
          }
          const objectConverter = new ObjectConvert();
          Convert.metaJson.push(objectConverter.convert(metaJson.CustomObject, fullName));
        }
      });
    });
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      const csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, 'object-meta.csv'), csvStr, 'utf8');
    }
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return {
      MetaJson: Convert.metaJson,
    };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Convert.objectExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    return parse(path).base.replace(Convert.objectExtension, '');
  }
}
