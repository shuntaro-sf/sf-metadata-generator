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
import { FieldConvert } from '../../src/utils/fieldConvert';

const outputDir = './test/resources/project/force-app/main/default/objects/Account/fields/';

const picklistdelimiter = ';';
let testSession: TestSession;

const testData: Json = {
  fullName: ['picklist__c'],
  label: ['picklistdelimiter'],
  description: ['Picklist field.'],
  type: ['Picklist'],
  required: ['false'],
  trackTrending: ['false'],
  valueSet: [
    {
      valueSetDefinition: [
        {
          sorted: ['false'],
          value: [
            {
              fullName: ['Yes'],
              default: ['false'],
              label: ['Yes'],
            },
            {
              fullName: ['No'],
              default: ['false'],
              label: ['No'],
            },
          ],
        },
      ],
    },
  ],
};

describe('fieldConvert NUTs', () => {
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

  it('fieldConvert', async () => {
    const fieldConverter = new FieldConvert();
    const outputJson = fieldConverter.convert(testData, picklistdelimiter);
    Object.keys(testData).forEach((key: string) => {
      if (key === 'valueSet') {
        const values = testData[key][0].valueSetDefinition[0].value;
        const fullNames: any[] = [];
        const labels: any[] = [];
        values.forEach((value: { fullName: any; label: any }) => {
          fullNames.push(value.fullName);
          labels.push(value.label);
        });
        expect(fullNames.join(picklistdelimiter)).to.equal(outputJson['picklistFullName']);
        expect(labels.join(picklistdelimiter)).to.equal(outputJson['picklistLabel']);
      } else {
        expect(testData[key][0]).to.equal(outputJson[key]);
      }
    });
  });
});
