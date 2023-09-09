/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { FieldGenerateResult } from '../../../../src/commands/metadata/field/generate';
import { FieldTemplateResult } from '../../../../src/commands/metadata/field/template';

const alias = 'sfPlugin';
const outputDir = './test/resources/project/force-app/main/default/objects/Account/fields/';
const templateOutputDir = './test/resources/input/field/';

let testSession: TestSession;

describe('metadata field generate template NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it('metadata field generate', () => {
    execCmd<FieldTemplateResult>('metadata field template --outputdir ' + templateOutputDir + ' --json', {
      ensureExitCode: 0,
    });

    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + templateOutputDir + '/Template.csv --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );
    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});
