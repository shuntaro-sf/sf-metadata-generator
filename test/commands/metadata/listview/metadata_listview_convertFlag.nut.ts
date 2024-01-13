/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { ListviewConvertResult } from '../../../../src/commands/metadata/listview/convert';

const validSourceDir = './test/resources/input/listview/convert_source/';
const validOutputDir = './test/resources/project/force-app/main/default/objects/Account/listViews/';
const invalidSourceDir = './test/resources/input/listview/notFound/';
const invalidOutputDir = './test/resources/project/force-app/main/default/objects/notFound/listViews/';

describe('metadata listview convert flag NUTs', () => {
  before('prepare session', async () => {});

  after(async () => {});

  it('metadata listview convert source flag', () => {
    execCmd<ListviewConvertResult>(
      'metadata listview convert --sourcedir ' + invalidSourceDir + ' --outputdir ' + validOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
  it('metadata listview convert outputdir flag', () => {
    execCmd<ListviewConvertResult>(
      'metadata listview convert --sourcedir ' + validSourceDir + ' --outputdir ' + invalidOutputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
