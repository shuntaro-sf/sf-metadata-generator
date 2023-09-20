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
import { FieldGenerateResult, DefaultValues } from '../../../../src/commands/metadata/field/generate';
import * as ConfigData from '../../../../src/';

const alias = 'sfPlugin';
const inputFilePath = './test/resources/input/field/field_relationInputToUpdate.csv';
const outputDir = './test/resources/project/force-app/main/default/objects/Custom_Object__c/fields/';

const defaultValues = ConfigData.fieldGenerateConfig.defaultValues as DefaultValues;
let testSession: TestSession;

describe('metadata field generate relation update NUTs', () => {
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

  it('metadata field generate relation update', async () => {
    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );

    const result = execCmd<FieldGenerateResult>(
      'metadata field generate --updates --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as FieldGenerateResult;

    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );

    const inputJson = await csvtojson().fromFile(inputFilePath);

    inputJson.forEach((inputRow) => {
      const fullName = inputRow.fullName;
      const type = inputRow.type;
      const customFieldJson = result?.MetaJson[fullName].CustomField;
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
