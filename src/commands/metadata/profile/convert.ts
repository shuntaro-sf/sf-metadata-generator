/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
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

import { ProfileConvert } from '../../../utils/profileConvert';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'profile.convert');

export type ProfileConvertResult = {
  csvDataStr: string;
};

export default class Convert extends SfCommand<ProfileConvertResult> {
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

  private static header = ConfigData.profileConvertConfig.header;
  private static profileExtension = ConfigData.profileConvertConfig.profileExtension;
  private static metaJson = [] as Array<{ [key: string]: any }>;

  public async run(): Promise<ProfileConvertResult> {
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
        console.log(err.message);
      } else {
        if (!Object.keys(metaJson).includes('Profile')) {
          return;
        }
        const profileConverter = new ProfileConvert();
        Convert.metaJson.push(profileConverter.convert(metaJson.TabObject, fullName));
      }
    });
    let csvStr = '';
    if (Convert.metaJson.length > 0) {
      const json2csvParser = new Parser();
      csvStr = json2csvParser.parse(Convert.metaJson);
      writeFileSync(join(flags.outputdir, fullName + '.csv'), csvStr, 'utf8');
    }
    return { csvDataStr: csvStr };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Convert.profileExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    return parse(path).base.replace(Convert.profileExtension, '');
  }
}
