/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import * as ConfigData from '../';

export class ObjectConvert {
  private static header = ConfigData.objectConvertConfig.header;

  public convert(metaJson: { [key: string]: any }, fullName: string): { [key: string]: any } {
    const row = {} as { [key: string]: any };
    ObjectConvert.header.forEach((tag: string) => {
      if (tag === 'nameFieldLabel' || tag === 'nameFieldDisplayFormat' || tag === 'nameFieldType') {
        row[tag] = this.getValueForNameField(metaJson, tag);
      } else {
        row[tag] = Object.keys(metaJson).includes(tag) ? metaJson[tag][0] : '';
      }
    });
    row['fullName'] = fullName;
    return row;
  }

  private getValueForNameField(metaJson: { [key: string]: any }, tag: string): string {
    if (!Object.keys(metaJson).includes('nameField')) {
      return '';
    }
    const nameFieldElm = metaJson.nameField[0] as { [key: string]: string };
    const xmlTag =
      tag.replace('nameField', '').substring(0, 1).toLocaleLowerCase() + tag.replace('nameField', '').substring(1);
    return nameFieldElm[xmlTag];
  }
}
