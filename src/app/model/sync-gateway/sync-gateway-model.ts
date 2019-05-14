import * as _ from 'lodash';

import { Attachment } from '../attachment/attachment';

export interface ISyncGatewayModel {
  created_by?: string;
  created_date?: string;
  modified_by?: string;
  modified_date?: string;
  _id?: string;
  _attachments?: Map<string, Attachment>;
  _rev?: string;
}

// @TODO refactor out Attachment and create a new model called SyncGatewayModelAttachable
export class SyncGatewayModel implements ISyncGatewayModel {
  _id;
  _rev;
  _attachments;
  created_by;
  created_date;
  modified_by;
  modified_date;

  constructor(
    _id?: string,
    _rev?: string,
    _attachments?: Map<string, Attachment>,
    created_by?: string,
    created_date?: string,
    modified_by?: string,
    modified_date?: string
  ) {
    this._id = _id;
    this._rev = _rev;
    this._attachments = _attachments;
    this.created_by = created_by;
    this.created_date = created_date;
    this.modified_by = modified_by;
    this.modified_date = modified_date;
  }

  mergeCouchbaseDocumentData(couchbaseDataObject: Object) {
    _.merge(this, couchbaseDataObject);
  }

  hasAttachmentWithName(name: string): boolean {
    return this._attachments && Object.keys(this._attachments).includes(name);
  }

  getAttachmentWithName(name: string): Attachment {
    if (this.hasAttachmentWithName(name)) {
      return this._attachments.get(name);
    }

    return null;
  }
}
