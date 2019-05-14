import * as _ from 'lodash';

import {
  BaseContent, IBaseContent,
  contentTypes, contentStatus,
  PRODUCTS, IContentProducts } from './base-content';
import { IContentMap } from '../../core/content/content.service';

export interface IContainer extends IBaseContent {
  children: Array<string>;
  notes: String;
}

export class Container extends BaseContent implements IContainer {
  children = [];
  notes;
  calculated_status: string;

  constructor(data?: IContainer) {
    super({
      _id: _.get(data, '_id'),
      _rev: _.get(data, '_rev'),
      _attachments: _.get(data, '_attachments'),
      parent_id: _.get(data, 'parent_id', null),
      created_by: _.get(data, 'created_by'),
      created_date: _.get(data, 'created_date'),
      modified_by: _.get(data, 'modified_by'),
      modified_date: _.get(data, 'modified_date'),
      active_dates: _.get(data, 'active_dates'),
      content_status: _.get(data, 'content_status'),
      tile_image_path: _.get(data, 'tile_image_path'),
      type: _.get(data, 'type', contentTypes.CONTAINER),
      title: _.get(data, 'title'),
      new_content_date: _.get(data, 'new_content_date'),
      products: _.get(data, 'products')
    });

    this.children = _.get(data, 'children', []);
    this.notes = _.get(data, 'notes');
  }

  getStatus(options?: {contentMap?: IContentMap, date?: Date}): string {
    options = options || {};
    if (!options.contentMap) {
      throw 'Container.getStatus requires a content map';
    }

    const childStatuses = this.children.reduce((statuses: {[status: string]: boolean}, childId: string) => {
      if (!options.contentMap[childId]) {
        return statuses;
      }
      statuses[options.contentMap[childId].getStatus(options)] = true;
      return statuses;
    }, {});

    if (childStatuses[contentStatus.ACTIVE]) {
      return contentStatus.ACTIVE;
    } else if (childStatuses[contentStatus.APPROVED]) {
      return contentStatus.APPROVED;
    } else if (childStatuses[contentStatus.QA]) {
      return contentStatus.QA;
    } else if (childStatuses[contentStatus.INACTIVE]) {
      return contentStatus.INACTIVE;
    } else if (childStatuses[contentStatus.CANCELED]) {
      return contentStatus.CANCELED;
    }

    return contentStatus.INACTIVE;
  }
}