/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { clearLine, moveCursor } from 'readline';
import xml2js from 'xml2js';
import * as unzipper from 'unzipper';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages, SfError } from '@salesforce/core';
import { Schema } from 'jsforce';
import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'field.retrieve');

export type FieldRetrieveResult = {
  csvDataStr: string;
};

export default class Retrieve extends SfCommand<FieldRetrieveResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': Flags.requiredOrg({
      char: 'o',
      summary: messages.getMessage('flags.target-org.summary'),
      required: true,
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
    manifest: Flags.file({
      char: 'x',
      summary: messages.getMessage('flags.manifest.summary'),
      required: true,
    }),
  };

  private static header = ConfigData.fieldRetrieveConfig.header;
  // private static fieldExtension = ConfigData.fieldGenerateConfig.fieldExtension;

  public async run(): Promise<FieldRetrieveResult> {
    const { flags } = await this.parse(Retrieve);

    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    const usernameOrConnection =
      flags['target-org'].getUsername() ?? flags['target-org'].getConnection(flags['api-version']);

    const metaJsons = await this.retrieve(usernameOrConnection, flags.manifest);
    const csvList = [] as string[][];
    csvList[0] = Retrieve.header;
    Object.keys(metaJsons).forEach((fullName) => {
      const row = [...Array(Retrieve.header.length)].map((elm, idx) => {
        if (Retrieve.header[idx] === 'picklistFullName' || Retrieve.header[idx] === 'picklistLabel') {
          return this.getValueForPicklist(metaJsons[fullName], idx, flags);
        } else if (
          Retrieve.header[idx] === 'summaryFilterItemsField' ||
          Retrieve.header[idx] === 'summaryFilterItemsOperation' ||
          Retrieve.header[idx] === 'summaryFilterItemsValue'
        ) {
          return this.getValueForSummaryFilterItems(metaJsons[fullName], idx);
        } else {
          return Object.keys(metaJsons[fullName]).includes(Retrieve.header[idx])
            ? this.convertSpecialChars(metaJsons[fullName][Retrieve.header[idx]][0])
            : '';
        }
      });
      csvList.push(row);
    });
    const csvStr = csvList.join('\n');
    writeFileSync(join(flags.outputdir, 'field-meta.csv'), csvStr, 'utf8');
    console.log();
    console.log(messages.getMessage('success') + flags.outputdir + '.');
    return {
      csvDataStr: csvStr,
    };
  }

  private async retrieve(
    usernameOrConnection: string | Connection<Schema>,
    manifest: string
  ): Promise<{ [key: string]: any }> {
    const set = await ComponentSet.fromManifest({
      manifestPath: manifest,
      forceAddWildcards: true,
    });

    const retrieve = await set.retrieve({
      usernameOrConnection,
      output: '/path/to/force-app',
      merge: true,
      format: 'source',
      suppressEvents: false,
    });

    let spinerIdx = 0;
    const spiner = ['|', '/', '-', '\\'];
    retrieve.onUpdate(() => {
      const blue = '\u001b[34m';
      const white = '\u001b[37m';
      clearLine(process.stdout, 0);
      moveCursor(process.stdout, -9999, 0);
      process.stdout.write(blue + 'Retrieving now: ' + spiner[spinerIdx] + white);
      spinerIdx++;
    });

    const result = await retrieve.pollStatus();

    const zipFileContents = Buffer.from(result.response.zipFile, 'base64');
    const metadataDir = await unzipper.Open.buffer(zipFileContents);
    const fileBuffers: any[] = [];
    const metaJsons = {} as { [key: string]: any };
    metadataDir.files.forEach((file) => {
      if (extname(file.path) === '.object') {
        const fileBuffer = file.buffer();
        fileBuffers.push(fileBuffer);
      }
    });
    const parser = new xml2js.Parser();
    await Promise.all(fileBuffers).then((buffer) => {
      parser.parseString(buffer.toString(), (err, metaJson) => {
        if (err) {
          console.log(err.message);
        } else {
          metaJson.CustomObject.fields.forEach((field: { [key: string]: any }) => {
            metaJsons[field.fullName] = field;
          });
        }
      });
    });
    return metaJsons;
  }

  private getValueForPicklist(
    metaJson: { [key: string]: any },
    colIndex: number,
    flags: { outputdir: string; picklistdelimiter: string } & { [flag: string]: any } & {
      json: boolean | undefined;
    }
  ): string {
    if (!Object.keys(metaJson).includes('valueSet')) {
      return '';
    }
    const valueSetElm = metaJson.valueSet[0];
    const valueSetDefinitionElm = valueSetElm.valueSetDefinition[0];
    const valueElms = valueSetDefinitionElm.value as Array<{
      [key: string]: string;
    }>;
    const tag =
      Retrieve.header[colIndex].replace('picklist', '').substring(0, 1).toLocaleLowerCase() +
      Retrieve.header[colIndex].replace('picklist', '').substring(1);
    return valueElms.map((picklistElm) => picklistElm[tag]).join(flags.picklistdelimiter);
  }

  private getValueForSummaryFilterItems(metaJson: { [key: string]: any }, colIndex: number): string {
    if (!Object.keys(metaJson).includes('summaryFilterItems')) {
      return '';
    }
    const summaryFIlterItemsElm = metaJson.summaryFilterItems[0] as { [key: string]: string };
    const tag =
      Retrieve.header[colIndex].replace('summaryFilterItems', '').substring(0, 1).toLocaleLowerCase() +
      Retrieve.header[colIndex].replace('summaryFilterItems', '').substring(1);
    return summaryFIlterItemsElm[tag];
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
