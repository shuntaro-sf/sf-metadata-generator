/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable guard-for-in */
import { existsSync, writeFileSync } from 'fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as TemplateData from '../../../';

export type TemplateInput = { [key: string]: any | TemplateInput };

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'field.template');

export type ObjectTemplateResult = {
  CsvTemplate: string;
};

export default class Template extends SfCommand<ObjectTemplateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    outputdir: Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.outputdir.summary'),
      default: './',
    }),
  };

  private static templateInput = TemplateData.objectTemplateConfig.template as TemplateInput;

  public async run(): Promise<ObjectTemplateResult> {
    const { flags } = await this.parse(Template);
    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    const csvList = [];
    csvList[0] = Object.keys(Object.values(Template.templateInput)[0]);
    Object.keys(Template.templateInput).forEach((key) => {
      csvList.push(Object.values(Template.templateInput[key]));
    });
    const csvStr = csvList.join('\n');
    writeFileSync(flags.outputdir + '/object-template.csv', csvStr, 'utf8');
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return { CsvTemplate: csvStr };
  }
}
