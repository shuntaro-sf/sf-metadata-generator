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
import { ListviewConvertResult } from '../../../../src/commands/metadata/listview/convert';
// import * as ConfigData from '../../../../src/';

// const alias = 'sfPlugin';
const sourceDir = './test/resources/input/listview/convert_source/';
const outputDir = './test/resources/output/';

// const defaultValues = ConfigData.listviewGenerateConfig.defaultValues as Json;

describe('metadata listview convert NUTs', () => {
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

  it('metadata listview convert', async () => {
    execCmd<ListviewConvertResult>(
      'metadata listview convert --sourcedir ' + sourceDir + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );
  });
});
