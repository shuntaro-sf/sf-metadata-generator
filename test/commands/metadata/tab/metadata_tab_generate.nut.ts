/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import csvtojson from 'csvtojson';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

import { Json } from '../../../../src/utils/type';
import { TabGenerateResult } from '../../../../src/commands/metadata/tab/generate';
import * as ConfigData from '../../../../src/';

const alias = 'sfPlugin';
const projectPath = './test/resources/project/';
const inputFilePath = './test/resources/input/tab/tab_input.csv';
const outputDir = './test/resources/project/force-app/main/default/tabs/';

const defaultValues = ConfigData.tabGenerateConfig.defaultValues as Json;

describe('metadata tab generate NUTs', () => {
  before('prepare session', async () => {
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
  });

  it('metadata tab generate', async () => {
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
      const customTabJson = result?.MetaJson[fullName].CustomTab;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        if (inputRow[tag] === '' && defaultValues[type][tag] !== null) {
          expect(customTabJson[tag]).to.equal(defaultValues[type][tag]);
        } else if (customTabJson[tag] !== undefined) {
          expect(customTabJson[tag].replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/lt;/g, '<')).to.equal(
            inputRow[tag]
          );
        }
      });
    });
    shell.cd(projectPath);
    execCmd('project deploy validate --source-dir ' + outputDir.replace(projectPath, '') + ' --target-org ' + alias, {
      ensureExitCode: 0,
      cli: 'sf',
    });
    shell.cd('../../../');
  });
});
