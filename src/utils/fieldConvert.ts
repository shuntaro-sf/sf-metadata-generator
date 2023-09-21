/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable class-methods-use-this */
import * as ConfigData from '../';

export class FieldConvert {
  private static header = ConfigData.fieldConvertConfig.header;

  public convert(metaJson: { [key: string]: any }, picklistdelimiter: string): { [key: string]: any } {
    const row = {} as { [key: string]: any };
    FieldConvert.header.forEach((tag: string) => {
      if (tag === 'picklistFullName' || tag === 'picklistLabel') {
        row[tag] = this.getValueForPicklist(metaJson, tag, picklistdelimiter);
      } else if (
        tag === 'summaryFilterItemsField' ||
        tag === 'summaryFilterItemsOperation' ||
        tag === 'summaryFilterItemsValue'
      ) {
        row[tag] = this.getValueForSummaryFilterItems(metaJson, tag);
      } else {
        row[tag] = Object.keys(metaJson).includes(tag) ? metaJson[tag][0] : '';
      }
    });

    return row;
  }
  private getValueForPicklist(metaJson: { [key: string]: any }, tag: string, picklistdelimiter: string): string {
    if (!Object.keys(metaJson).includes('valueSet')) {
      return '';
    }
    const valueSetElm = metaJson.valueSet[0];
    const valueSetDefinitionElm = valueSetElm.valueSetDefinition[0];
    const valueElms = valueSetDefinitionElm.value as Array<{
      [key: string]: string;
    }>;
    const xmlTag =
      tag.replace('picklist', '').substring(0, 1).toLocaleLowerCase() + tag.replace('picklist', '').substring(1);
    return valueElms.map((picklistElm) => picklistElm[xmlTag]).join(picklistdelimiter);
  }

  private getValueForSummaryFilterItems(metaJson: { [key: string]: any }, tag: string): string {
    if (!Object.keys(metaJson).includes('summaryFilterItems')) {
      return '';
    }
    const summaryFIlterItemsElm = metaJson.summaryFilterItems[0] as { [key: string]: string };
    const xmlTag =
      tag.replace('summaryFilterItems', '').substring(0, 1).toLocaleLowerCase() +
      tag.replace('summaryFilterItems', '').substring(1);
    return summaryFIlterItemsElm[xmlTag][0];
  }
}
