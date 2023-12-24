/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { writeFileSync, existsSync } from 'fs';
import { join, extname, parse } from 'path';
import { clearLine, moveCursor } from 'readline';
import { Parser } from '@json2csv/plainjs';
import xml2js from 'xml2js';
import * as unzipper from 'unzipper';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages, SfError } from '@salesforce/core';
import { Schema } from 'jsforce';
import { ComponentSet } from '@salesforce/source-deploy-retrieve';

import { ListviewConvert } from '../../../utils/listviewConvert';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'listview.retrieve');

export type listviewRetrieveResult = {
  csvDataStr: string;
};

export default class Retrieve extends SfCommand<listviewRetrieveResult> {
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
      default: ConfigData.listviewGenerateConfig.columnsDelimiter,
    }),
    manifest: Flags.file({
      char: 'x',
      summary: messages.getMessage('flags.manifest.summary'),
      required: true,
    }),
  };

  private static objectExtension = ConfigData.objectRetrieveConfig.objectExtension;
  private static metaJson = {} as { [key: string]: any };

  public async run(): Promise<listviewRetrieveResult> {
    const { flags } = await this.parse(Retrieve);

    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    const usernameOrConnection =
      flags['target-org'].getUsername() ?? flags['target-org'].getConnection(flags['api-version']);

    const metaJsons = await this.retrieve(usernameOrConnection, flags.manifest);
    Object.keys(metaJsons).forEach((objectFullName: any) => {
      const metaJson = [] as Array<{ [key: string]: any }>;
      const listviewConverter = new ListviewConvert();
      Object.keys(metaJsons[objectFullName]).forEach((listviewFullName: any) => {
        metaJson.push(listviewConverter.convert(metaJsons[objectFullName][listviewFullName], flags.picklistdelimiter));
      });
      Retrieve.metaJson[objectFullName] = metaJson;
    });
    let csvStr = '';
    if (Object.keys(Retrieve.metaJson).length > 0) {
      const json2csvParser = new Parser();
      Object.keys(Retrieve.metaJson).forEach((fullName: any) => {
        csvStr = json2csvParser.parse(Retrieve.metaJson[fullName]);
        writeFileSync(join(flags.outputdir, fullName + '.listview-meta.csv'), csvStr, 'utf8');
      });
    }
    this.log();
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return {
      csvDataStr: csvStr,
    };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Retrieve.objectExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    return parse(path).base.replace(Retrieve.objectExtension, '');
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
      spinerIdx %= spiner.length;
    });

    const result = await retrieve.pollStatus();

    const zipFileContents = Buffer.from(result.response.zipFile, 'base64');
    const metadataDir = await unzipper.Open.buffer(zipFileContents);
    const fileBuffers = {} as { [key: string]: any };
    const metaJsons = {} as { [key: string]: any };

    for (const file of metadataDir.files) {
      if (extname(file.path) === Retrieve.objectExtension) {
        const fullName = this.getFullNameFromPath(file.path);
        // eslint-disable-next-line no-await-in-loop
        fileBuffers[fullName] = await file.buffer();
      }
    }
    const parser = new xml2js.Parser();

    Object.keys(fileBuffers).forEach((fullName) => {
      parser.parseString(fileBuffers[fullName], (err, metaJson) => {
        if (err) {
          this.log(err.message);
        } else {
          const listviewMetaJson = {} as { [key: string]: any };
          metaJson.CustomObject.listviews.forEach((listview: { [key: string]: any }) => {
            listviewMetaJson[listview.fullName] = listview;
          });
          metaJsons[fullName] = listviewMetaJson;
        }
      });
    });
    return metaJsons;
  }
}
