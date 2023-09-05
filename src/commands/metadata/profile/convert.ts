/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-metadata-generator', 'profile.convert');

export type ProfileConvertResult = {
  csvDataStr: string;
};
export type PermissionTags = { [key: string]: any | PermissionTags };

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

  private static permissionTags = ConfigData.profileConvertConfig.permissionTags as PermissionTags;
  private static header = ConfigData.profileConvertConfig.header;

  public async run(): Promise<ProfileConvertResult> {
    const { flags } = await this.parse(Convert);
    if (flags.source === undefined || !existsSync(flags.source)) {
      throw new SfError(messages.getMessage('error.path.source') + flags.source);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }

    const metastr = readFileSync(flags.source, { encoding: 'utf8' });

    const csvDataStr = this.convertXmlToRowOfCsv(metastr);

    writeFileSync(join(flags.outputdir, 'profile-meta.csv'), csvDataStr, 'utf8');

    return { csvDataStr };
  }

  private convertXmlToRowOfCsv(metastr: string): string {
    const csvDataStr = Convert.header.join(',') + '\n';
    for (const type in Convert.permissionTags) {
      const keyTag = Convert.permissionTags[type]['keyTag'];
      const regexp = new RegExp('<' + type + '>');
      const tagMetastrs = metastr.split(regexp);
      for (const tagMetastr of tagMetastrs) {
        this.addRowStrToCsvStr(String(keyTag), type, csvDataStr, tagMetastr);
      }
    }
    return csvDataStr;
  }

  private addRowStrToCsvStr(keyTag: string, type: string, csvDataStr: string, tagMetastr: string): void {
    const indexOfFullName = Convert.header.indexOf('fullName');
    const row = Array(Convert.header.length);
    const keyTagRegexp = new RegExp('<' + keyTag + '>(.+)<\\/' + keyTag + '>');
    const keyTagValue = tagMetastr.match(keyTagRegexp);
    if (keyTagValue === null) {
      return;
    }
    row[indexOfFullName] = this.convertSpecialChars(keyTagValue[1]);
    for (const tag of Convert.permissionTags[type]['tags']) {
      const indexOfTag = Convert.header.indexOf(String(tag));
      const tagRegexp = new RegExp('<' + tag + '>(.+)<\\/' + tag + '>');
      const tagValue = tagMetastr.match(tagRegexp);
      if (tagValue === null) {
        return;
      }
      row[indexOfTag] = this.convertSpecialChars(tagValue[1]);
    }
    csvDataStr += row.join(',') + '\n';
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
