/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { ListviewGenerateResult } from '../../../../src/commands/metadata/listview/generate';
import { ListviewTemplateResult } from '../../../../src/commands/metadata/listview/template';

const outputDir = './test/resources/project/force-app/main/default/objects/Account/listViews/';
const templateOutputDir = './test/resources/input/listview/';

describe('metadata listview generate template NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata listview generate', () => {
    execCmd<ListviewTemplateResult>('metadata listview template --outputdir ' + templateOutputDir + ' --json', {
      ensureExitCode: 0,
    });

    execCmd<ListviewGenerateResult>(
      'metadata listview generate --input ' +
        templateOutputDir +
        'listview-template.csv --outputdir ' +
        outputDir +
        ' --json',
      {
        ensureExitCode: 0,
      }
    );
  });
});
