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
import { ObjectConvertResult } from '../../../../src/commands/metadata/object/convert';
// import * as ConfigData from '../../../../src/';

// const alias = 'sfPlugin';
const sourceDir = './test/resources/input/object/convert_source/';
const outputDir = './test/resources/output/';

// const defaultValues = ConfigData.objectGenerateConfig.defaultValues as Json;

describe('metadata object convert NUTs', () => {
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

  it('metadata object convert', async () => {
    execCmd<ObjectConvertResult>(
      'metadata object convert --sourcedir ' + sourceDir + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );
  });
});
