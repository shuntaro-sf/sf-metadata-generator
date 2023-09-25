/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { FieldConvertResult } from '../../../../src/commands/metadata/field/convert';

const validSourceDir = './test/resources/input/field/convert_source/';
const validOutputDir = './test/resources/project/force-app/main/default/objects/Account/fields/';
const invalidSourceDir = './test/resources/input/field/notFound/';
const invalidOutputDir = './test/resources/project/force-app/main/default/objects/ObjectNotFound/fields/';

// let testSession: TestSession;

describe('metadata field convert flag NUTs', () => {
  before('prepare session', async () => {
    //  testSession = await TestSession.create();
  });

  after(async () => {
    // await testSession?.clean();
  });

  it('metadata field convert source flag', () => {
    execCmd<FieldConvertResult>(
      'metadata field convert --sourcedir ' + invalidSourceDir + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata field convert outputdir flag', () => {
    execCmd<FieldConvertResult>(
      'metadata field convert --sourcedir ' + validSourceDir + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
