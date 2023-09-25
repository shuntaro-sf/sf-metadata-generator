/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { TabGenerateResult } from '../../../../src/commands/metadata/tab/generate';

const validInputFilePath = './test/resources/input/tab/tab_input.csv';
const validOutputDir = './test/resources/project/force-app/main/default/tabs/';
const invalidInputFilePath = './test/resources/input/tab/inputNotFound.csv';
const invalidOutputDir = './test/resources/project/force-app/main/default/notFound/';

describe('metadata tab generate flag NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata tab generate input flag', () => {
    execCmd<TabGenerateResult>(
      'metadata tab generate --input ' + invalidInputFilePath + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata tab generate outputdir flag', () => {
    execCmd<TabGenerateResult>(
      'metadata tab generate --input ' + validInputFilePath + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
