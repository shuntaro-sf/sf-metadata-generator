/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import * as ConfigData from '../';

export class TabConvert {
  private static header = ConfigData.tabConvertConfig.header;
  private static metaSettings = ConfigData.tabConvertConfig.metaSettings as { [key: string]: string };

  public convert(metaJson: { [key: string]: any }, fullName: string): { [key: string]: any } {
    const row = {} as { [key: string]: any };
    TabConvert.header.forEach((tag: string) => {
      if (tag === 'type') {
        const typeTag = Object.keys(TabConvert.metaSettings).filter((typeKey) =>
          Object.keys(metaJson).includes(typeKey)
        )[0];
        row[tag] = TabConvert.metaSettings[typeTag];
      } else {
        row[tag] = Object.keys(metaJson).includes(tag) ? metaJson[tag][0] : '';
      }
    });
    row['fullName'] = fullName;
    return row;
  }
}
