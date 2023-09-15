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
import { ObjectGenerateResult } from '../../../../src/commands/metadata/object/generate';

const alias = 'sfPlugin';
const inputFilePath = './test/resources/input/object/object_negativeTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/objects/';

let testSession: TestSession;

describe('metadata object generate negative NUTs', () => {
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

  it('metadata object generate negative', () => {
    const result = execCmd<ObjectGenerateResult>(
      'metadata object generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as ObjectGenerateResult;

    const input = fs.readFileSync(inputFilePath, 'utf-8');
    const inputJson = csvtojson().fromFile(input);

    void inputJson.forEach((inputRow) => {
      const fullName = inputRow.fullName;
      const customObjectJson = result?.MetaJson[fullName].CustomObject;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        expect(customObjectJson[tag]).to.equal(inputRow[tag]);
      });
    });

    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});