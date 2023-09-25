/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import { execCmd } from '@salesforce/cli-plugins-testkit';

import { TabGenerateResult } from '../../../../src/commands/metadata/tab/generate';

const inputFilePath = './test/resources/input/tab/tab_negativeTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/tabs/';

describe('metadata tab generate negative NUTs', () => {
  before('prepare session', async () => {
    fs.readdir(outputDir, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        shell.rm(path.join(outputDir, file));
      }
    });
  });

  after(async () => {
    fs.readdir(outputDir, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        shell.rm(path.join(outputDir, file));
      }
    });
  });

  it('metadata tab generate negative', async () => {
    execCmd<TabGenerateResult>(
      'metadata tab generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
