/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

import { Json } from '../../src/utils/type';
import { TabConvert } from '../../src/utils/tabConvert';

const outputDir = './test/resources/project/force-app/main/default/tabs/';

let testSession: TestSession;

const testData: Json = {
  fullName: ['Web'],
  label: ['Web'],
  type: ['Web'],
  hasSidebar: ['false'],
  motif: ['Custom62: Chalkboard'],
  url: ['https://google.com'],
  urlEncodingKey: ['UTF-8'],
};

describe('tabConvert NUTs', () => {
  before('prepare session', async () => {
    testSession = await TestSession.create();

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

    await testSession?.clean();
  });

  it('tabConvert', async () => {
    const tabConverter = new TabConvert();
    const outputJson = tabConverter.convert(testData, 'Web');
    Object.keys(testData).forEach((key: string) => {
      expect(testData[key][0]).to.equal(outputJson[key]);
    });
  });
});
