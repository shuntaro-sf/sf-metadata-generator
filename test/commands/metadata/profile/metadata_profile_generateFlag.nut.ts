/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { ProfileGenerateResult } from '../../../../src/commands/metadata/profile/generate';

const validInputFilePath = './test/resources/input/profile/profile_input.csv';
const validOutputDir = './test/resources/project/force-app/main/default/profiles/';
const invalidInputFilePath = './test/resources/input/profile/inputNotFound.csv';
const invalidOutputDir = './test/resources/project/force-app/main/default/notFound/';
const validSourcePath = './test/resources/project/force-app/main/default/profiles/Admin.profile-meta.xml';
const invalidSourcePath = './test/resources/project/force-app/main/default/profiles/NotFound.xml';

describe('metadata profile generate flag NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata profile generate input flag', () => {
    execCmd<ProfileGenerateResult>(
      'metadata profile generate --input ' +
        invalidInputFilePath +
        ' --outputdir ' +
        validOutputDir +
        ' --source ' +
        validSourcePath +
        ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata profile generate outputdir flag', () => {
    execCmd<ProfileGenerateResult>(
      'metadata profile generate --input ' +
        validInputFilePath +
        ' --outputdir ' +
        invalidOutputDir +
        ' --source ' +
        validSourcePath +
        ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata profile generate source flag', () => {
    execCmd<ProfileGenerateResult>(
      'metadata profile generate --input ' +
        validInputFilePath +
        ' --outputdir ' +
        invalidOutputDir +
        ' --source ' +
        invalidSourcePath +
        ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
