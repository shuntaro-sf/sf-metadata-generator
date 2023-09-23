/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { ObjectGenerateResult } from '../../../../src/commands/metadata/object/generate';

const validInputFilePath = './test/resources/input/object/object_input.csv';
const validOutputDir = './test/resources/project/force-app/main/default/objects/';
const invalidInputFilePath = './test/resources/input/object/inputNotFound.csv';
const invalidOutputDir = './test/resources/project/force-app/main/default/notFound/';

let testSession: TestSession;

describe('metadata object generate flag NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it('metadata object generate input flag', () => {
    execCmd<ObjectGenerateResult>(
      'metadata object generate --input ' + invalidInputFilePath + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata object generate outputdir flag', () => {
    execCmd<ObjectGenerateResult>(
      'metadata object generate --input ' + validInputFilePath + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
