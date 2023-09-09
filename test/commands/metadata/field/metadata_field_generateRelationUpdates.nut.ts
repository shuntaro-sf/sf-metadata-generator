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
import { FieldGenerateResult } from '../../../../src/commands/metadata/field/generate';

const alias = 'sfPlugin';
const inputFilePath = './test/resources/input/field/field_relationInputToUpdate.csv';
const outputDir = './test/resources/project/force-app/main/default/objects/Custom_Object__c/fields/';

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

  it('metadata field generate relation update', () => {
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
    console.log(result);
    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );

    const input = fs.readFileSync(inputFilePath, 'utf-8');
    const inputJson = csvtojson().fromFile(input);

    void inputJson.forEach((inputRow) => {
      const fullName = inputRow.fullName;
      const customFieldJson = result?.MetaJson[fullName].CustomField;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        expect(customFieldJson[tag]).to.equal(inputRow[tag]);
      });
    });

    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});
