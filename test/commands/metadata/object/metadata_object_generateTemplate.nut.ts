/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { ObjectGenerateResult } from '../../../../src/commands/metadata/object/generate';
import { ObjectTemplateResult } from '../../../../src/commands/metadata/object/template';

const alias = 'sfPlugin';
const outputDir = './test/resources/project/force-app/main/default/objects/';
const templateOutputDir = './test/resources/input/object/';

let testSession: TestSession;

describe('metadata object generate template NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();
  });

  after(async () => {
    await testSession?.clean();
  });

  it('metadata object generate', () => {
    execCmd<ObjectTemplateResult>('metadata object template --outputdir ' + templateOutputDir + ' --json', {
      ensureExitCode: 0,
    });

    execCmd<ObjectGenerateResult>(
      'metadata object generate --input ' +
        templateOutputDir +
        'object-template.csv --outputdir ' +
        outputDir +
        ' --json',
      {
        ensureExitCode: 0,
      }
    );
    execCmd('project deploy start --checkonly --source-dir ' + outputDir + ' --target-org ' + alias, { cli: 'sf' });
  });
});
