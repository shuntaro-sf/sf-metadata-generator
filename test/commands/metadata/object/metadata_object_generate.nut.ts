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
import { ObjectGenerateResult } from '../../../../src/commands/metadata/object/generate';
import * as ConfigData from '../../../../src/';

const alias = 'sfPlugin';
const projectPath = './test/resources/project/';
const inputFilePath = './test/resources/input/object/object_input.csv';
const outputDir = './test/resources/project/force-app/main/default/objects/';

const defaultValues = ConfigData.objectGenerateConfig.defaultValues as Json;

describe('metadata object generate NUTs', () => {
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

  it('metadata object generate', async () => {
    const result = execCmd<ObjectGenerateResult>(
      'metadata object generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as ObjectGenerateResult;
    const inputJson = await csvtojson().fromFile(inputFilePath);

    inputJson.forEach((inputRow) => {
      const fullName = inputRow.fullName;
      const customFieldJson = result?.MetaJson[fullName].CustomObject;
      console.log(inputRow);
      console.log(customFieldJson);
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        if (inputRow[tag] === '' && defaultValues[tag] !== null) {
          expect(customFieldJson[tag]).to.equal(defaultValues[tag]);
        } else if (customFieldJson[tag] !== undefined) {
          expect(customFieldJson[tag].replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/lt;/g, '<')).to.equal(
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
