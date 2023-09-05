/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable guard-for-in */
import { existsSync, writeFileSync } from 'fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import * as TemplateData from '../../../';

export type TemplateInput = { [key: string]: any | TemplateInput };

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sf-metadata-generator', 'field.template');

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

    let csvTemplate = '';
    const firstRowKey = Object.keys(Template.templateInput)[0];
    const firstRow = Template.templateInput[firstRowKey];
    csvTemplate += Object.keys(String(firstRow)).join(',') + '\n';
    for (const rowName in Template.templateInput) {
      csvTemplate += Object.values(String(Template.templateInput[rowName])).join(',') + '\n';
    }
    writeFileSync(flags.outputdir + '/Template.csv', csvTemplate, 'utf8');
    console.log(messages.getMessage('success') + flags.outputdir + '.');
    return { CsvTemplate: csvTemplate };
  }
}
