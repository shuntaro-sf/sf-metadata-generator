/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { FieldGenerateResult } from '../../../../src/commands/metadata/field/generate';

const validInputFilePath = './test/resources/input/field/field_input.csv';
const validOutputDir = './test/resources/project/force-app/main/default/objects/Account/fields/';
const invalidInputFilePath = './test/resources/input/field/inputNotFound.csv';
const invalidOutputDir = './test/resources/project/force-app/main/default/objects/ObjectNotFound/fields/';

let testSession: TestSession;

describe('metadata field generate flag NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it('metadata field generate input flag', () => {
    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + invalidInputFilePath + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata field generate outputdir flag', () => {
    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + validInputFilePath + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
