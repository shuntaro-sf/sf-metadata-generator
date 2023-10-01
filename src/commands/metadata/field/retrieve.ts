/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import { writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { clearLine, moveCursor } from 'readline';
import { Parser } from '@json2csv/plainjs';
import xml2js from 'xml2js';
import * as unzipper from 'unzipper';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Connection, Messages, SfError } from '@salesforce/core';
import { Schema } from 'jsforce';
import { ComponentSet } from '@salesforce/source-deploy-retrieve';

import { FieldConvert } from '../../../utils/fieldConvert';
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

  private static metaJson = [] as Array<{ [key: string]: any }>;

  public async run(): Promise<FieldRetrieveResult> {
    const { flags } = await this.parse(Retrieve);

    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    const usernameOrConnection =
      flags['target-org'].getUsername() ?? flags['target-org'].getConnection(flags['api-version']);

    const metaJsons = await this.retrieve(usernameOrConnection, flags.manifest);
    Object.keys(metaJsons).forEach((fullName) => {
      const fieldConverter = new FieldConvert();
      Retrieve.metaJson.push(fieldConverter.convert(metaJsons[fullName], flags.picklistdelimiter));
    });
    let csvStr = '';
    if (Retrieve.metaJson.length > 0) {
      const json2csvParser = new Parser();
      csvStr = json2csvParser.parse(Retrieve.metaJson);
      writeFileSync(join(flags.outputdir, 'field-meta.csv'), csvStr, 'utf8');
    }
    this.log();
    this.log(messages.getMessage('success') + flags.outputdir + '.');
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
      spinerIdx %= spiner.length;
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
          this.log(err.message);
        } else {
          metaJson.CustomObject.fields.forEach((field: { [key: string]: any }) => {
            metaJsons[field.fullName] = field;
          });
        }
      });
    });
    return metaJsons;
  }
}
