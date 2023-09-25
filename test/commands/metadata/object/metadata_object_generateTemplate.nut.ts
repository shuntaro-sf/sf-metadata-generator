/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { ObjectGenerateResult } from '../../../../src/commands/metadata/object/generate';
import { ObjectTemplateResult } from '../../../../src/commands/metadata/object/template';

const outputDir = './test/resources/project/force-app/main/default/objects/';
const templateOutputDir = './test/resources/input/object/';

describe('metadata object generate template NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

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
  });
});
