/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import csvtojson from 'csvtojson';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { ProfileGenerateResult } from '../../../../src/commands/metadata/profile/generate';

const inputFilePath = './test/resources/input/profile/profile_positiveTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/profiles/';
const sourcePath = './test/resources/project/force-app/main/default/profiles/Admin.profile-meta.xml';

describe('metadata profile generate positive NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata profile generate positive', async () => {
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

    const inputJson = await csvtojson().fromFile(inputFilePath);

    inputJson.forEach((inputRow) => {
      const customProfileJson = result?.MetaJson.Profile;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        if (customProfileJson[tag] !== undefined) {
          expect(customProfileJson[tag].replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/lt;/g, '<')).to.equal(
            inputRow[tag]
          );
        }
      });
    });
  });
});
