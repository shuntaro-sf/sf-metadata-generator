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
import { ObjectConvert } from '../../src/utils/objectConvert';

const outputDir = './test/resources/project/force-app/main/default/objects/Account/fields/';

let testSession: TestSession;

const testData: Json = {
  allowInChatterGroups: ['false'],
  deploymentStatus: ['Deployed'],
  enableActivities: ['false'],
  enableBulkApi: ['true'],
  enableFeeds: ['false'],
  enableHistory: ['false'],
  enableReports: ['false'],
  enableSearch: ['false'],
  enableSharing: ['true'],
  enableStreamingApi: ['true'],
  label: ['CustomObj'],
  nameField: [
    {
      label: ['CustomObjName'],
      type: ['Text'],
    },
  ],
};

describe('objectConvert NUTs', () => {
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

  it('objectConvert', async () => {
    const objectConverter = new ObjectConvert();
    const outputJson = objectConverter.convert(testData, 'test');
    Object.keys(testData).forEach((key: string) => {
      if (key === 'nameField') {
        const field = testData[key][0];
        expect(field.label).to.equal(outputJson['nameFieldLabel']);
        expect(field.type).to.equal(outputJson['nameFieldType']);
      } else {
        expect(testData[key][0]).to.equal(outputJson[key]);
      }
    });
  });
});
