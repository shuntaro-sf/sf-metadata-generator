/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import csvtojson from 'csvtojson';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { PermissionsetGenerateResult } from '../../../../src/commands/metadata/permissionset/generate';

const inputFilePath = './test/resources/input/permissionset/permissionset_positiveTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/permissionsets/';
const sourcePath =
  './test/resources/project/force-app/main/default/permissionsets/CustomPermissionset.permissionset-meta.xml';

describe('metadata permissionset generate positive NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata permissionset generate positive', async () => {
    const result = execCmd<PermissionsetGenerateResult>(
      'metadata permissionset generate --input ' +
        inputFilePath +
        ' --outputdir ' +
        outputDir +
        ' --source ' +
        sourcePath +
        ' --json',
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as PermissionsetGenerateResult;

    const inputJson = await csvtojson().fromFile(inputFilePath);

    inputJson.forEach((inputRow) => {
      const custompermissionsetJson = result?.MetaJson.permissionset;
      Object.keys(inputRow as { [key: string]: string }).forEach((tag) => {
        if (custompermissionsetJson[tag] !== undefined) {
          expect(
            custompermissionsetJson[tag].replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/lt;/g, '<')
          ).to.equal(inputRow[tag]);
        }
      });
    });
  });
});
