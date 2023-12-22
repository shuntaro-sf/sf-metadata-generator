/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';

import { PermissionsetGenerateResult } from '../../../../src/commands/metadata/permissionset/generate';

const inputFilePath = './test/resources/input/permissionset/permissionset_negativeTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/permissionsets/';
const sourcePath =
  './test/resources/project/force-app/main/default/permissionsets/CustomPermissionset.permissionset-meta.xml';

describe('metadata permissionset generate negative NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata permissionset generate negative', () => {
    execCmd<PermissionsetGenerateResult>(
      'metadata permissionset generate --input ' +
        inputFilePath +
        ' --outputdir ' +
        outputDir +
        ' --source ' +
        sourcePath +
        ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
