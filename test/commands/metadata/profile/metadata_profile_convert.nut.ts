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
import { ProfileConvertResult } from '../../../../src/commands/metadata/profile/convert';
// import * as ConfigData from '../../../../src/';

// const alias = 'sfPlugin';
const source = './test/resources/input/profile/convert_source/Admin.profile-meta.xml';
const outputDir = './test/resources/output/';

// const defaultValues = ConfigData.profileGenerateConfig.defaultValues as Json;

describe('metadata profile convert NUTs', () => {
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

  it('metadata profile convert', async () => {
    execCmd<ProfileConvertResult>(
      'metadata profile convert --source ' + source + ' --outputdir ' + outputDir + ' --json',
      {
        ensureExitCode: 0,
      }
    );
  });
});
