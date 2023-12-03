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

export class PermissionsetConvert {
  private static permissionTags = ConfigData.permissionsetConvertConfig.permissionTags as PermissionTags;
  private static header = ConfigData.permissionsetConvertConfig.header;

  private static metaJson = [] as Array<{ [key: string]: any }>;

  public convert(metaJson: { [key: string]: any }): Array<{ [key: string]: any }> {
    Object.keys(PermissionsetConvert.permissionTags).forEach((type) => {
      if (!Object.keys(metaJson).includes(type)) {
        return metaJson;
      }
      metaJson[type].forEach((elm: { [x: string]: any }) => {
        const row = {} as { [key: string]: any };
        row['type'] = type;
        row['fullName'] = elm[PermissionsetConvert.permissionTags[type].keyTag][0];
        PermissionsetConvert.permissionTags[type].tags.forEach((tag: string) => {
          if (!PermissionsetConvert.header.includes(tag)) {
            return;
          }
          row[tag] = elm[tag][0];
        });
        PermissionsetConvert.metaJson.push(row);
      });
    });
    return PermissionsetConvert.metaJson;
  }
}
