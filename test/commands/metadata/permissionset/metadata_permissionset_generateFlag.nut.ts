/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { PermissionsetGenerateResult } from '../../../../src/commands/metadata/permissionset/generate';

const validInputFilePath = './test/resources/input/permissionset/permissionset_input.csv';
const validOutputDir = './test/resources/project/force-app/main/default/permissionsets/';
const invalidInputFilePath = './test/resources/input/permissionset/inputNotFound.csv';
const invalidOutputDir = './test/resources/project/force-app/main/default/notFound/';
const validSourcePath =
  './test/resources/project/force-app/main/default/permissionsets/CustomPermissionset.permissionset-meta.xml';
const invalidSourcePath = './test/resources/project/force-app/main/default/permissionsets/NotFound.xml';

describe('metadata permissionset generate flag NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata permissionset generate input flag', () => {
    execCmd<PermissionsetGenerateResult>(
      'metadata permissionset generate --input ' +
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
  it('metadata permissionset generate outputdir flag', () => {
    execCmd<PermissionsetGenerateResult>(
      'metadata permissionset generate --input ' +
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
  it('metadata permissionset generate source flag', () => {
    execCmd<PermissionsetGenerateResult>(
      'metadata permissionset generate --input ' +
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
