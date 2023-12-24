/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import * as ConfigData from '../';

export class ListviewConvert {
  private static header = ConfigData.listviewConvertConfig.header;

  public convert(metaJson: { [key: string]: any }, columnsdelimiter: string): { [key: string]: any } {
    const row = {} as { [key: string]: any };
    ListviewConvert.header.forEach((tag: string) => {
      if (tag === 'columns') {
        row[tag] = this.getValueForColumns(metaJson, columnsdelimiter);
      } else if (tag === 'filtersField' || tag === 'filtersOperation' || tag === 'filtersValue') {
        row[tag] = this.getValueForFilters(metaJson, tag, columnsdelimiter);
      } else {
        row[tag] = Object.keys(metaJson).includes(tag) ? metaJson[tag][0] : '';
      }
    });
    return row;
  }
  private getValueForColumns(metaJson: { [key: string]: any }, columnsdeliter: string): string {
    if (!Object.keys(metaJson).includes('columns')) {
      return '';
    }
    const columnsElm = metaJson.columns;
    return columnsElm.join(columnsdeliter);
  }

  private getValueForFilters(metaJson: { [key: string]: any }, tag: string, columnsdeliter: string): string {
    if (!Object.keys(metaJson).includes('filters')) {
      return '';
    }
    const filtersElms = metaJson.filters;
    const xmlTag =
      tag.replace('filters', '').substring(0, 1).toLocaleLowerCase() + tag.replace('filters', '').substring(1);
    console.log(filtersElms.map((elm: { [key: string]: any }) => elm[xmlTag][0]));
    return filtersElms.map((elm: { [key: string]: any }) => elm[xmlTag]).join(columnsdeliter);
  }
}
