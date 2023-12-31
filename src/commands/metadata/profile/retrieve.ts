/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { ProfileConvert } from '../../../utils/profileConvert';
import * as ConfigData from '../../../';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@shuntaro/sf-metadata-generator', 'profile.retrieve');

export type ProfileRetrieveResult = {
  csvDataStr: { [key: string]: string };
};

export default class Retrieve extends SfCommand<ProfileRetrieveResult> {
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
    manifest: Flags.file({
      char: 'x',
      summary: messages.getMessage('flags.manifest.summary'),
      required: true,
    }),
  };

  private static header = ConfigData.profileRetrieveConfig.header;
  private static profileExtension = ConfigData.profileRetrieveConfig.profileExtension;
  private static metaJson = [] as Array<{ [key: string]: any }>;

  public async run(): Promise<ProfileRetrieveResult> {
    const { flags } = await this.parse(Retrieve);

    if (!existsSync(flags.outputdir)) {
      throw new SfError(messages.getMessage('error.path.output') + flags.outputdir);
    }
    const usernameOrConnection =
      flags['target-org'].getUsername() ?? flags['target-org'].getConnection(flags['api-version']);
    const metaJsons = await this.retrieve(usernameOrConnection, flags.manifest);

    let csvList = [] as string[][];
    const csvStrs = {} as { [key: string]: string };

    Object.keys(metaJsons).forEach((fullName) => {
      csvList = [];
      csvList[0] = Retrieve.header;
      const objectConverter = new ProfileConvert();
      Retrieve.metaJson = objectConverter.convert(metaJsons[fullName]);

      let csvStr = '';
      if (Retrieve.metaJson.length > 0) {
        const json2csvParser = new Parser();
        csvStr = json2csvParser.parse(Retrieve.metaJson);
        writeFileSync(join(flags.outputdir, fullName + '.profile-meta.csv'), csvStr, 'utf8');
      }
    });
    this.log();
    this.log(messages.getMessage('success') + flags.outputdir + '.');
    return { csvDataStr: csvStrs };
  }

  private getFullNameFromPath(path: string): string {
    const fullNameRegExp = new RegExp(Retrieve.profileExtension + '$');
    const fullNameMatch = parse(path).base.match(fullNameRegExp);
    if (fullNameMatch === null) {
      return '';
    }
    return parse(path).base.replace(Retrieve.profileExtension, '');
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
      if (extname(file.path) === Retrieve.profileExtension) {
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
          metaJsons[fullName] = metaJson.Profile;
        }
      });
    });
    return metaJsons;
  }
}
