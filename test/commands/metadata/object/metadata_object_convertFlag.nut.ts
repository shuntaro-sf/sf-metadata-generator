/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { ObjectConvertResult } from '../../../../src/commands/metadata/object/convert';

const validSourceDir = './test/resources/input/object/convert_source/';
const validOutputDir = './test/resources/project/force-app/main/default/objects/Account/objects/';
const invalidSourceDir = './test/resources/input/object/notFound/';
const invalidOutputDir = './test/resources/project/force-app/main/default/objects/ObjectNotFound/objects/';

let testSession: TestSession;

describe('metadata object convert flag NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it('metadata object convert source flag', () => {
    execCmd<ObjectConvertResult>(
      'metadata object convert --sourcedir ' + invalidSourceDir + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata object convert outputdir flag', () => {
    execCmd<ObjectConvertResult>(
      'metadata object convert --sourcedir ' + validSourceDir + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
