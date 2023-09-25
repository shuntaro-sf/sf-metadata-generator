/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
// import csvtojson from 'csvtojson';
import { execCmd } from '@salesforce/cli-plugins-testkit';
// import { expect } from 'chai';

// import { Json } from '../../../../src/utils/type';
import { FieldConvertResult } from '../../../../src/commands/metadata/field/convert';
// import * as ConfigData from '../../../../src/';

// const alias = 'sfPlugin';
const sourceDir = './test/resources/input/field/convert_source/';
const outputDir = './test/resources/output/';

// const defaultValues = ConfigData.fieldGenerateConfig.defaultValues as Json;
// let testSession: TestSession;

describe('metadata field convert NUTs', () => {
  before('prepare session', async () => {
    //  testSession = await TestSession.create();

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

    // await testSession?.clean();
  });

  it('metadata field convert', async () => {
    execCmd<FieldConvertResult>(
      'metadata field convert --sourcedir ' + sourceDir + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );
  });
});
