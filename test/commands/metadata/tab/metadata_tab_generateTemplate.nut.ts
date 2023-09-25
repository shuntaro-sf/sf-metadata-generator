/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { TabGenerateResult } from '../../../../src/commands/metadata/tab/generate';
import { TabTemplateResult } from '../../../../src/commands/metadata/tab/template';

const alias = 'sfPlugin';
const outputDir = './test/resources/project/force-app/main/default/tabs/';
const templateOutputDir = './test/resources/input/tab/';

describe('metadata tab generate template NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata tab generate', () => {
    execCmd<TabTemplateResult>('metadata tab template --outputdir ' + templateOutputDir + ' --json', {
      ensureExitCode: 0,
    });

    execCmd<TabGenerateResult>(
      'metadata tab generate --input ' + templateOutputDir + 'tab-template.csv --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );
    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});
