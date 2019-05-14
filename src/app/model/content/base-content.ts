import * as _ from 'lodash';
import * as moment from 'moment';

import { CONTENT_BUCKET, SyncGatewayService } from '../../core/sync-gateway/sync-gateway.service';
import { IContentMap } from '../../core/content/content.service';
import { ISyncGatewayModel, SyncGatewayModel } from '../sync-gateway/sync-gateway-model';

export const TILE_IMAGE_KEY = 'tile_image';
export const ACTIVE_DATE_FORMAT = 'YYYY-MM-DD';
export const LICENSE_DATE_FORMAT = 'MM/DD/YYYY';

export interface IContentProducts {
  apollo: boolean;
  engage: boolean;
  focus: boolean;
  rehab: boolean;
}

export const allProducts = 'all';

export const PRODUCTS = {
  APOLLO: 'apollo',
  ENGAGE: 'engage',
  FOCUS: 'focus',
  REHAB: 'rehab'
};

export const contentTypes = {
  ROOT_CONTAINER: 'root_container',
  CONTAINER: 'container',
  CONTENT: 'content'
};

export const contentStatus = {
  ACTIVE: 'active',
  APPROVED: 'approved',
  CANCELED: 'canceled',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  QA: 'qa'
};

export const contentStatusLabels = [
  { label: 'Approved', value: contentStatus.APPROVED },
  { label: 'Content QA', value: contentStatus.QA },
  { label: 'Active', value: contentStatus.ACTIVE },
  { label: 'Inactive', value: contentStatus.INACTIVE },
  { label: 'Canceled', value: contentStatus.CANCELED }
];

export const userContentStatusLabels = contentStatusLabels.filter(option => {
  switch (option.value) {
    case contentStatus.APPROVED:
    case contentStatus.QA:
      return true;
    default:
      return false;
  }
});

export const contentStatusList = _.values(contentStatus);

export function isContainer(type) {
  return type === contentTypes.ROOT_CONTAINER || type === contentTypes.CONTAINER;
}

export function isContent(type) {
  return type === contentTypes.CONTENT;
}

export interface IActiveDateRange {
  start: string;
  end: string;
  products: {
    engage: boolean;
    focus: boolean;
    rehab: boolean;
  };
}

export interface IBaseContent extends ISyncGatewayModel {
  parent_id: string;
  active_dates: IActiveDateRange[];
  content_status: string;
  tile_image_path: string;
  title: string;
  type: string;
  new_content_date?: string;
  license_expiration_date?: string;
  products: IContentProducts;
  library_path?: string;
}

export class BaseContent extends SyncGatewayModel implements IBaseContent {
  parent_id = null;
  content_status = '';
  tile_image_path = '';
  type;
  title = '';
  new_content_date;
  active_dates = [];
  products: IContentProducts;
  library_path?: string;

  constructor(data?: IBaseContent) {
    super(
      data._id,
      data._rev,
      data._attachments,
      data.created_by,
      data.created_date,
      data.modified_by,
      data.modified_date
    );

    this.parent_id = data.parent_id || null;
    this.content_status = data.content_status;
    this.tile_image_path = data.tile_image_path;
    this.type = data.type;
    this.title = data.title;
    this.new_content_date = data.new_content_date;
    this.active_dates = data.active_dates || [];
    this.products = data.products || {
      apollo: false,
      engage: false,
      focus: false,
      rehab: false
    };
    this.library_path = data.library_path || '';
  }

  isContainer() {
    return isContainer(this.type);
  }

  isContent() {
    return isContent(this.type);
  }

  getTileImage() {
    if (!this._attachments) {
      return null;
    }

    return SyncGatewayService.getAttachmentPath(
      CONTENT_BUCKET,
      this._id,
      TILE_IMAGE_KEY,
      this._rev
    );
  }

  activeDateMatch(date: Date = new Date()) {
    return (
      (this.active_dates || []).filter(range =>
        moment
          .utc(date)
          .isBetween(
            moment.utc(range.start),
            moment.utc(range.end).add(86399, 'seconds'),
            null,
            '[]'
          )
      ).length > 0
    );
  }

  previouslyDateActive(date: Date = new Date()) {
    // @TODO assumes data set is ordered properly, when we add multi ranges, add sorter for this
    const firstDate = _.get(this.active_dates, '[0].start');

    if (!firstDate) {
      return false;
    }

    return moment.utc(date).isAfter(moment.utc(firstDate));
  }

  getStatus(options?: { contentMap?: IContentMap; date?: Date }): string {
    throw 'Not Implemented';
  }

  getStatusAppliedDate(options?: { contentMap?: IContentMap; date?: Date }) {
    return this.getStatus(options);
  }

  getDisplayActiveDatesUtc() {
    if (this.active_dates && this.active_dates.length > 0) {
      return this.active_dates.map(range => ({
        start: moment.utc(range.start).format('MM/DD/YYYY'),
        end: moment.utc(range.end).format('MM/DD/YYYY')
      }));
    }

    return [{ start: '', end: '' }];
  }
}
