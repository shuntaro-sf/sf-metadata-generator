/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import csvtojson from 'csvtojson';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { ProfileGenerateResult } from '../../../../src/commands/metadata/profile/generate';

const alias = 'sfPlugin';
const inputFilePath = './test/resources/input/profile/profile_negativeTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/profiles/';
const sourcePath = './test/resources/project/force-app/main/default/profiles/Admin.profile-meta.xml';

let testSession: TestSession;

describe('metadata profile generate negative NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it('metadata profile generate negative', () => {
    const result = execCmd<ProfileGenerateResult>(
      'metadata profile generate --input ' +
        inputFilePath +
        ' --outputdir ' +
        outputDir +
        ' --source ' +
        sourcePath +
        ' --json',
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as ProfileGenerateResult;

    const input = fs.readFileSync(inputFilePath, 'utf-8');
    const inputJson = csvtojson().fromFile(input);

    void inputJson.forEach((inputRow) => {
      const fullName = inputRow.fullName;
      const customProfileJson = result?.MetaJson[fullName].CustomProfile;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        expect(customProfileJson[tag]).to.equal(inputRow[tag]);
      });
    });

    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});
