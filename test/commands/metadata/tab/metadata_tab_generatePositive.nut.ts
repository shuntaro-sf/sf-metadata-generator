/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import csvtojson from 'csvtojson';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

import { Json } from '../../../../src/utils/type';
import { TabGenerateResult } from '../../../../src/commands/metadata/tab/generate';
import * as ConfigData from '../../../../src/';

const alias = 'sfPlugin';
const inputFilePath = './test/resources/input/tab/tab_positiveTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/tabs/';

const defaultValues = ConfigData.tabGenerateConfig.defaultValues as Json;
let testSession: TestSession;

describe('metadata tab generate positive NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();

    fs.readdir(outputDir, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        shell.rm(path.join(outputDir, file));
      }
    });
  });

  after(async () => {
    fs.readdir(outputDir, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        shell.rm(path.join(outputDir, file));
      }
    });

    await testSession?.clean();
  });

  it('metadata tab generate positive', async () => {
    const result = execCmd<TabGenerateResult>(
      'metadata tab generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as TabGenerateResult;

    const inputJson = await csvtojson().fromFile(inputFilePath);

    inputJson.forEach((inputRow) => {
      const fullName = inputRow.fullName;
      const type = inputRow.type;
      const customFieldJson = result?.MetaJson[fullName].CustomTab;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        if (inputRow[tag] === '' && defaultValues[type][tag] !== null) {
          expect(customFieldJson[tag]).to.equal(defaultValues[type][tag]);
        } else if (customFieldJson[tag] !== undefined) {
          expect(customFieldJson[tag]).to.equal(inputRow[tag]);
        }
      });
    });

    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});
