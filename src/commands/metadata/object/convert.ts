/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'field.convert');

export type ObjectConvertResult = {
  csvDataStr: string;
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

  public async run(): Promise<ObjectConvertResult> {
    const { flags } = await this.parse(Convert);
    if (flags.sourcedir === undefined || !existsSync(flags.sourcedir)) {
      throw new SfError(messages.getMessage('error.path.source') + flags.sourcedir);
    }
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }

    const dirsInSourcedir = readdirSync(flags.sourcedir);
    let csvDataStr = Convert.header.join(',') + '\n';

    for (const dir of dirsInSourcedir) {
      const dirForEachSource = readdirSync(join(flags.sourcedir, dir));
      const metaFile = dirForEachSource.find((element) => element.includes(dir));
      if (metaFile === undefined) {
        continue;
      }
      const metastr = readFileSync(join(flags.sourcedir, dir, metaFile), { encoding: 'utf8' });
      const row = [] as string[];

      if (!this.isCustomObject(dir)) {
        continue;
      }

      this.convertXmlToRowOfCsv(metastr, row);
      csvDataStr += row.join(',') + '\n';
    }

    writeFileSync(join(flags.outputdir, 'object-meta.csv'), csvDataStr, 'utf8');

    // Return an object to be displayed with --json*/
    return { csvDataStr };
  }

  private convertXmlToRowOfCsv(metastr: string, row: string[]): void {
    for (const tag of Convert.header) {
      const indexOfTag = Convert.header.indexOf(tag);
      if (tag !== 'nameFieldType' && tag !== 'nameFieldLabel') {
        const regexp = new RegExp('\\<' + tag + '\\>(.+)\\</' + tag + '\\>');
        const tagValue = metastr.match(regexp);
        if (tagValue !== null) {
          row[indexOfTag] = this.convertSpecialChars(tagValue[1]);
        } else {
          row[indexOfTag] = '';
        }
      } else {
        const valueOfTag = this.getValueOfPicklistTag(metastr, row, tag);
        row[indexOfTag] = this.convertSpecialChars(valueOfTag);
      }
    }
  }

  private getValueOfPicklistTag(metastr: string, row: string[], tag: string): string {
    const indexOfTag = Convert.header.indexOf(tag);
    const regexp = new RegExp('\\<nameField\\>[\\s\\S]*\\</nameField\\>');
    const tagValue = metastr.match(regexp);
    if (tagValue === null) {
      row[indexOfTag] = '';
      return '';
    }
    const nameField = tagValue[0];
    let valueOfTag = '';
    if (tag === 'nameFieldType') {
      const regexpFullName = new RegExp('\\<type\\>(.+)\\</type\\>', 'g');
      const nameFieldTypes = nameField.match(regexpFullName);

      if (nameFieldTypes !== null) {
        let nameFieldTypeValue = nameFieldTypes.join(';');
        nameFieldTypeValue = nameFieldTypeValue.replace(/<type>/g, '');
        nameFieldTypeValue = nameFieldTypeValue.replace(/<\/type>/g, '');
        valueOfTag = nameFieldTypeValue;
      }
    } else if (tag === 'nameFieldLabel') {
      const regexpLabel = new RegExp('\\<label\\>(.+)\\</label\\>', 'g');
      const nameFieldLabels = nameField.match(regexpLabel);
      if (nameFieldLabels !== null) {
        let nameFieldLabelValue = nameFieldLabels.join(';');
        nameFieldLabelValue = nameFieldLabelValue.replace(/<label>/g, '');
        nameFieldLabelValue = nameFieldLabelValue.replace(/<\/label>/g, '');
        valueOfTag = nameFieldLabelValue;
      }
    }
    return this.convertSpecialChars(valueOfTag);
  }

  private isCustomObject(file: string): boolean {
    const inputSplit = file.split('.');
    const fullName = inputSplit[0];
    return fullName.includes('__c');
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
