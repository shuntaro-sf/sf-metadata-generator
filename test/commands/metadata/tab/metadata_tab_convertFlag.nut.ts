/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { TabConvertResult } from '../../../../src/commands/metadata/tab/convert';

const validSourceDir = './test/resources/input/tab/convert_source/';
const validOutputDir = './test/resources/project/force-app/main/default/tabs/Account/tabs/';
const invalidSourceDir = './test/resources/input/tab/notFound/';
const invalidOutputDir = './test/resources/project/force-app/main/default/tabs/ObjectNotFound/tabs/';

describe('metadata tab convert flag NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata tab convert source flag', () => {
    execCmd<TabConvertResult>(
      'metadata tab convert --sourcedir ' + invalidSourceDir + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata tab convert outputdir flag', () => {
    execCmd<TabConvertResult>(
      'metadata tab convert --sourcedir ' + validSourceDir + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
