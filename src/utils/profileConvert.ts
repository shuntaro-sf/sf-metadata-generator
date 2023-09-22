/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ConfigData from '../';

export type PermissionTags = { [key: string]: any | PermissionTags };

export class ProfileConvert {
  private static permissionTags = ConfigData.profileConvertConfig.permissionTags as PermissionTags;
  private static header = ConfigData.profileConvertConfig.header;

  private static metaJson = [] as Array<{ [key: string]: any }>;

  public convert(metaJson: { [key: string]: any }, type: string): { [key: string]: any } {
    if (!Object.keys(metaJson.Profile).includes(type)) {
      return metaJson;
    }
    metaJson.Profile[type].forEach((elm: { [x: string]: any }) => {
      const row = {} as { [key: string]: any };
      row['type'] = type;
      row['fullName'] = elm[ProfileConvert.permissionTags[type].keyTag][0];
      ProfileConvert.permissionTags[type].tags.forEach((tag: string) => {
        if (!ProfileConvert.header.includes(tag)) {
          return;
        }
        row[tag] = elm[tag][0];
      });
      ProfileConvert.metaJson.push(row);
    });
    return metaJson;
  }
}
