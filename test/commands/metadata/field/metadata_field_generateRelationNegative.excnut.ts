/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';

import { execCmd } from '@salesforce/cli-plugins-testkit';

import { FieldGenerateResult } from '../../../../src/commands/metadata/field/generate';

const inputFilePath = './test/resources/input/field/field_relationNegativeTestInput.csv';
const outputDir = './test/resources/project/force-app/main/default/objects/Custom_Object__c/fields/';

describe('metadata field generate relation negative NUTs', () => {
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

  it('metadata field generate relation negative ', async () => {
    execCmd<FieldGenerateResult>(
      'metadata field generate --input ' + inputFilePath + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 1,
      }
    );
  });
});
