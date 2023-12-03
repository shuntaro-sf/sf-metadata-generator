/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, parse } from 'path';
import { Parser } from '@json2csv/plainjs';
import xml2js from 'xml2js';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import { Json } from '../../../utils/type';
import { PermissionsetConvert } from '../../../utils/permissionsetConvert';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'permissionset.convert');

export type PermissionsetConvertResult = {
  MetaJson: Json;
};

export default class Convert extends SfCommand<PermissionsetConvertResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    source: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.source.summary'),
    }),
    outputdir: Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.outputdir.summary'),
      default: './',
    }),
  };

  private static header = ConfigData.permissionsetConvertConfig.header;
  private static permissionsetExtension = ConfigData.permissionsetConvertConfig.permissionsetExtension;
  private static metaJson = [] as Array<{ [key: string]: any }>;

  public async run(): Promise<PermissionsetConvertResult> {
    const { flags } = await this.parse(Convert);
    if (flags.source === undefined || !existsSync(flags.source)) {
      throw new SfError(messages.getMessage('error.path.source') + flags.source);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    const parser = new xml2js.Parser();

    const csvList = [] as string[][];
    csvList[0] = Convert.header;
    const fullName = this.getFullNameFromPath(flags.source);
    if (fullName === '') {
      throw new SfError(messages.getMessage('error.source.extension') + flags.outputdir);
    }

    const metaXml = readFileSync(flags.source, { encoding: 'utf8' });
    parser.parseString(metaXml, (err, metaJson) => {
      if (err) {
        this.log(err.message);
      } else {
        if (!Object.keys(metaJson).includes('PermissionSet')) {
          return;
        }
        const permissionsetConverter = new PermissionsetConvert();
        Convert.metaJson = permissionsetConverter.convert(metaJson.PermissionSet);
      }
    });
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      const csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, fullName + '.csv'), csvStr, 'utf8');
    }
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return { MetaJson: Convert.metaJson };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Convert.permissionsetExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    return parse(path).base.replace(Convert.permissionsetExtension, '');
  }
}
