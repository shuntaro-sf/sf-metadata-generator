/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';

import { ProfileGenerateResult } from '../../../../src/commands/metadata/profile/generate';

const inputFilePath = './test/resources/input/profile/profile_negativeTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/profiles/';
const sourcePath = './test/resources/project/force-app/main/default/profiles/Admin.profile-meta.xml';

describe('metadata profile generate negative NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata profile generate negative', () => {
    execCmd<ProfileGenerateResult>(
      'metadata profile generate --input ' +
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
