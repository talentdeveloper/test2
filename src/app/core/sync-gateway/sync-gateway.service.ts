/**
 *  SyncGatewayService
 **
 *  This class will setup communication with a sync gateway service.
 *
 *  Communication happens through a series of REST API calls.
 *  See documentation links below for API info.
 *
 *  This serivce wraps an Http request with some common
 *  configuration so it does not need to be repeated across the
 *  application.
 *
 *
 *  Public API:
 *  @see https://developer.couchbase.com/documentation/mobile/1.3/references/sync-gateway/rest-api/index.html
 *
 *  Admin API:
 *  @see https://developer.couchbase.com/documentation/mobile/1.3/references/sync-gateway/admin-rest-api/index.html
 */

import * as _ from 'lodash';
import { Injectable, Injector } from '@angular/core';
import {
  Http,
  Headers,
  Request,
  RequestOptions,
  RequestMethod,
  Response,
  URLSearchParams,
  RequestOptionsArgs
} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as moment from 'moment/moment';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { environment } from '../../../environments/environment';
import { PortalAPIService } from '../../core/portal-api/portal-api.service';
import { UiEventService } from '../ui-event-service/ui-event-service';
import {
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_IN2L,
  USER_TYPE_IN2L_ADMIN,
  IUser
} from '../../model/user/user';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';
import { UnauthorizedMessage } from '../ui-event-service/ui-unauthorized';

export const ACCOUNT_BUCKET = 'account_data';
export const CONTENT_BUCKET = 'content_meta_data';
export const DEVICE_FACILITY_BUCKET = 'device_facility_data';
export const DOWNLOAD_STATUS_BUCKET = 'download_status_data';
export const FAVORITES_BUCKET = 'favorites';
export const MESSAGE_BUCKET = 'message_data';
export const RESIDENT_BUCKET = 'resident_data';
export const USER_PROFILE_BUCKET = 'user_profile_data';

export const ACCOUNT_DEVICE_VIEW = 'device';
export const DEVICE_STATUS_VIEW = 'device_file_data';
export const RESIDENT_SMS_VIEW = 'sms';
export const USER_BY_EMAIL = 'user_by_email';

export interface IUpdateResult {
  id: string;
  rev?: string;
  ok?: boolean;
  error?: string;
  reason?: string;
  status?: string;
}

export interface IBulkUpdateResult {
  docs: IUpdateResult[];
}

export interface IApiBulkUpdateResult {
  id?: string;
  rev?: string;
  error?: string;
  reason?: string;
  status?: number;
}

// List of buckets that each user type has access to
const USER_TYPE_BUCKETS = {
  [USER_TYPE_FACILITY_ADMIN]: [
    ACCOUNT_BUCKET,
    RESIDENT_BUCKET,
    FAVORITES_BUCKET,
    MESSAGE_BUCKET,
    USER_PROFILE_BUCKET
  ],
  [USER_TYPE_ACCOUNT_ADMIN]: [
    ACCOUNT_BUCKET,
    RESIDENT_BUCKET,
    FAVORITES_BUCKET,
    MESSAGE_BUCKET,
    USER_PROFILE_BUCKET
  ],
  [USER_TYPE_IN2L]: [USER_PROFILE_BUCKET, CONTENT_BUCKET],
  [USER_TYPE_IN2L_ADMIN]: [
    ACCOUNT_BUCKET,
    RESIDENT_BUCKET,
    FAVORITES_BUCKET,
    MESSAGE_BUCKET,
    USER_PROFILE_BUCKET,
    DOWNLOAD_STATUS_BUCKET,
    CONTENT_BUCKET
  ]
};

@Injectable()
export class SyncGatewayService {
  static cache = {};

  private sessions = {};

  private currentUserEmail: string = null;
  private baseSgOptions: RequestOptionsArgs = {
    headers: new Headers({ Authorization: '' })
  };

  public static formatDateForCouchbase(date: Date = new Date()) {
    return moment.utc(date).toISOString();
  }

  public static normalizeUrl(path: string): string {
    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    return `/${path}`;
  }

  public static getAttachmentPath(
    bucket: string,
    document_id: string,
    attachment_name: string,
    revision?: string
  ): string {
    // images are cached within the session, so we'll append the rev so the browser refreshes it if the user updates it
    return `${bucket}/${document_id}/${attachment_name}?${revision}`;
  }

  constructor(
    private http: Http,
    private portalAPIService: PortalAPIService,
    private uiEventService: UiEventService
  ) {
    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      this.clearCache(clearCacheMessage.bucket);
    });
  }

  clearCache(bucket?: string) {
    if (bucket) {
      Object.keys(SyncGatewayService.cache).forEach(key => {
        if (key.startsWith(bucket)) {
          delete SyncGatewayService.cache[key];
        }
      });
      delete SyncGatewayService.cache[bucket];
      return;
    }
    SyncGatewayService.cache = {};
  }

  changeFeedUrlForEnvironment(bucket: string): Observable<string> {
    const url = `${
      environment.syncGateway['websocketURL']
    }/${bucket}/_changes?feed=websocket&include_docs=true`
      .split('://')
      .join(
        `://${this.getUsernameFromEmail(this.currentUserEmail)}:${
          environment.syncGateway.password
        }@`
      );

    console.log('change feed url: ' + url);
    return Observable.of(url);
  }

  // --- bucket change feed methods --
  getChanges(
    bucket: string
  ): Observable<{
    results: { seq: string; id: string; changes: { rev: string }[] }[];
    last_seq: string;
  }> {
    const hasSession = this.setAuthHeader();
    if (!hasSession) {
      return Observable.of(null);
    }

    const url = `${environment.syncGateway.publicURL}/${bucket}/_changes`;
    return this.http.get(url, this.baseSgOptions).mergeMap(result => Observable.of(result.json()));
  }

  /**
   * Requests directly to Sync Gateway with email credentials
   */

  setCurrentUserEmail(email: string) {
    this.currentUserEmail = email;
  }

  getCurrentUserEmail(): string {
    return this.currentUserEmail;
  }

  removeCurrentUser() {
    this.currentUserEmail = null;
    this.baseSgOptions.headers.set('Authorization', '');
    this.endSession();
  }

  // initialize a session
  setAuthHeader(): boolean {
    if (!this.currentUserEmail) {
      this.baseSgOptions.headers.set('Authorization', '');
      return false;
    }

    if (this.baseSgOptions.headers.get('Authorization').length) {
      return true;
    }

    if (this.currentUserEmail) {
      const sgUser = this.getUsernameFromEmail(this.currentUserEmail);
      this.baseSgOptions.headers.set(
        'Authorization',
        'Basic ' + new Buffer(sgUser + ':' + environment.syncGateway.password).toString('base64')
      );
      return true;
    }

    return false;
  }

  endSession() {
    Object.keys(this.sessions).forEach(bucket => {
      this.http
        .delete(`${environment.syncGateway.publicURL}/${bucket}/_session`)
        .subscribe(() => delete this.sessions[bucket]);
    });
  }

  // get all documents or a list based on _id keys
  getAll(bucket: string, keys: string[] = []): Observable<ISyncGatewayModel[]> {
    const hasSession = this.setAuthHeader();
    if (!hasSession) {
      return Observable.of(null);
    }

    const cacheKey = `sg_${bucket}_${keys.sort().join('_')}`;
    if (SyncGatewayService.cache[cacheKey]) {
      return Observable.of(
        keys.length ? [SyncGatewayService.cache[cacheKey]] : SyncGatewayService.cache[cacheKey]
      );
    }

    const observableCacheKey = 'observable_' + cacheKey;
    if (SyncGatewayService.cache[observableCacheKey]) {
      return SyncGatewayService.cache[observableCacheKey];
    }

    const missingKeys = keys.filter(key => !SyncGatewayService.cache[bucket + '_' + key]);

    if (keys.length && !missingKeys.length) {
      return Observable.of(keys.map(key => SyncGatewayService.cache[bucket + '_' + key]));
    }

    const url =
      `${environment.syncGateway.publicURL}/${bucket}/_all_docs?include_docs=true` +
      (missingKeys.length ? `&keys=["${missingKeys.sort().join('","')}"]` : '');
    if (url.length > 2083) {
      const splitAt = Math.floor(missingKeys.length / 2);
      SyncGatewayService.cache[observableCacheKey] = Observable.forkJoin([
        this.getAll(bucket, missingKeys.slice(0, splitAt)),
        this.getAll(bucket, missingKeys.slice(splitAt))
      ])
        .mergeMap(([first, second]) => {
          return Observable.of(first.concat(second));
        })
        .share();
      return SyncGatewayService.cache[observableCacheKey];
    }

    SyncGatewayService.cache[observableCacheKey] = this.http
      .get(url, this.baseSgOptions)
      .mergeMap((data: Response) => {
        if (!data) {
          return Observable.of([]);
        }

        const docs = data.json().rows.map(doc => (doc.doc ? doc.doc : doc));
        docs.forEach(item => {
          if (!item || item.error) {
            throw new Error('Error getting all from sync gateway - ' + JSON.stringify(item));
          }

          SyncGatewayService.cache[bucket + '_' + item._id] = item;
        });

        if (keys.length) {
          const items = keys.map(key => SyncGatewayService.cache[bucket + '_' + key]);
          return Observable.of(items);
        }

        return Observable.of(docs);
      })
      .share();

    return SyncGatewayService.cache[observableCacheKey];
  }

  get(bucket: string, id: string): Observable<ISyncGatewayModel> {
    return this.getAll(bucket, [id]).mergeMap((results: ISyncGatewayModel[]) => {
      if (results && results.length) {
        return Observable.of(results[0]);
      }

      return Observable.of(null);
    });
  }

  getRaw(bucket: string, id: string): Observable<ISyncGatewayModel> {
    delete SyncGatewayService.cache[bucket + '_' + id];
    return this.get(bucket, id);
  }

  getUserByEmailView(email?: string): Observable<ISyncGatewayModel> {
    if (!email) {
      return Observable.of(null);
    }

    const hasSession = this.setAuthHeader();
    if (!hasSession) {
      return Observable.of(null);
    }

    const cacheKey = 'getUserByEmailView_' + (email ? email.toLowerCase() : '');
    if (SyncGatewayService.cache[cacheKey]) {
      return Observable.of(SyncGatewayService.cache[cacheKey]);
    }

    return this.getView(USER_PROFILE_BUCKET, USER_PROFILE_BUCKET, 'user_by_email').mergeMap(
      (docs: ISyncGatewayModel[]) => {
        const users = docs.map(doc => <IUser>doc);
        SyncGatewayService.cache['getUserByEmailView_'] = users;
        users.forEach(item => {
          SyncGatewayService.cache['getUserByEmailView_' + item.email.toLowerCase()] = <
            ISyncGatewayModel
          >item;
        });

        return Observable.of(SyncGatewayService.cache[cacheKey] || null);
      }
    );
  }

  getView(
    bucket: string,
    designName: string,
    viewName: string,
    queryParams?: { key?: string }
  ): Observable<ISyncGatewayModel[]> {
    const baseUrl = `${
      environment.syncGateway.publicURL
    }/${bucket}/_design/${designName}/_view/${viewName}`;
    const queryString = queryParams && queryParams.key ? `?key="${queryParams.key}"` : '';
    const url = baseUrl + queryString;
    return this.http.get(url, this.baseSgOptions).mergeMap((data: Response) => {
      if (!data || !data.json().rows) {
        return Observable.of(null);
      }

      const results = data.json().rows.map(doc => <ISyncGatewayModel>doc.value);
      return Observable.of(results);
    });
  }

  upsert(
    bucket: string,
    doc: ISyncGatewayModel,
    refreshRev: boolean = false
  ): Observable<ISyncGatewayModel> {
    if (!doc._id) {
      return Observable.throw(new Error('Unable to update document due to missing _id'));
    }

    const hasSession = this.setAuthHeader();
    if (!hasSession) {
      return Observable.of(null);
    }

    const by = this.currentUserEmail || '';
    const date = SyncGatewayService.formatDateForCouchbase();

    doc['created_date'] = doc['created_date'] || date;
    doc['created_by'] = doc['created_by'] || by;
    doc['modified_date'] = date;
    doc['modified_by'] = by;

    const getObservable = refreshRev ? this.get(bucket, doc._id) : Observable.of(doc);
    return getObservable.mergeMap((remoteDoc: ISyncGatewayModel) => {
      const updateDoc = Object.assign({}, doc, {
        _rev: remoteDoc && remoteDoc._rev ? remoteDoc._rev : doc._rev
      });

      return this.http
        .put(
          `${environment.syncGateway.publicURL}/${bucket}/${updateDoc._id}` +
            (doc._rev ? `?rev=${updateDoc._rev}` : ''),
          updateDoc,
          this.baseSgOptions
        )
        .mergeMap(() => this.getRaw(bucket, updateDoc._id));
    });
  }
  /**
   * Old requests made through Portal-API
   */
  // --- document request methods ---

  sendGetDocumentRequest(bucket: string, documentId: string | number) {
    return this.sendRequest(this.documentPath(bucket, {}, { documentId: documentId }));
  }

  sendGetDocumentAttachmentRequest(bucket: string, doc: Object, attachmentName: string) {
    return this.sendRequest(this.documentPath(bucket, doc, { attachmentName }));
  }

  sendGetAllDocumentsRequest(bucket: string) {
    if (SyncGatewayService.cache[bucket]) {
      return SyncGatewayService.cache[bucket];
    }

    // getMultipleDocumentsRequest returns all by default
    SyncGatewayService.cache[bucket] = this.sendGetMultipleDocumentsRequest(bucket).share();
    return SyncGatewayService.cache[bucket];
  }

  sendAddDocumentRequest(bucket: string, key: string | number, doc: Object) {
    const documentPath = this.documentPath(bucket, {}, { documentId: key });
    const by = this.currentUserEmail || '';
    const date = SyncGatewayService.formatDateForCouchbase();

    doc['created_date'] = date;
    doc['created_by'] = by;
    doc['modified_date'] = date;
    doc['modified_by'] = by;

    const requestOptions = new RequestOptions({
      headers: this.getHeadersByFileType('json'),
      body: this.encodeForCouchbase(doc)
    });

    return this.sendRequest(documentPath, RequestMethod.Put, requestOptions);
  }

  sendGetMultipleDocumentsRequest(
    bucket: string,
    options?: { include_docs?: boolean; keys?: string[] }
  ) {
    const path = `${bucket}/_all_docs`;
    const query = new URLSearchParams();

    // set default options
    options = Object.assign({}, { include_docs: true, keys: [] }, options);

    // assign query params as needed
    query.append('include_docs', options.include_docs.toString());

    if (options.keys.length > 0) {
      // keys query param value needs to be in a format like:
      // keys=["doc1","doc2","doc3"]
      query.append('keys', `["${options.keys.join('","')}"]`);
    }

    // this sync gateway call returns a customized result object, we need
    // to parse the documents out of the result
    return this.sendRequest(`${path}?${query.toString()}`, RequestMethod.Get).map(results => {
      // no rows, return an empty array
      if (!results.rows) {
        return [];
      }

      results = results.rows.filter(row => !row.doc._deleted);

      // if include docs, return an array of the full documents
      if (options.include_docs) {
        return results.map(row => row.doc);
      }

      // if not including docs, return an array of ids
      return results.rows.map(row => row.id);
    });
  }

  sendUpdateDocumentRequest(bucket: string, doc: any): Observable<IUpdateResult> {
    if (!doc._id) {
      throw new Error('Unable to update document due to missing _id');
    }

    const documentPath = this.documentPath(bucket, doc, { addRevision: !!doc._rev });
    const by = this.currentUserEmail || '';
    const date = SyncGatewayService.formatDateForCouchbase();

    doc['created_date'] = doc['created_date'] || date;
    doc['created_by'] = doc['created_by'] || by;
    doc['modified_date'] = date;
    doc['modified_by'] = by;

    const requestOptions = new RequestOptions({
      headers: this.getHeadersByFileType('json'),
      body: this.encodeForCouchbase(doc)
    });

    return this.sendRequest(documentPath, RequestMethod.Put, requestOptions);
  }

  sendDeleteDocumentRequest(bucket: string, doc: Object) {
    const documentPath = this.documentPath(bucket, doc, { addRevision: true });

    return this.sendRequest(documentPath, RequestMethod.Delete);
  }

  sendUpdateDocumentAttachmentRequest(
    bucket: string,
    doc: Object,
    base64Data: string,
    filename: string
  ) {
    const documentPath = this.documentPath(bucket, doc, {
      attachmentName: filename,
      addRevision: true
    });

    return this.portalAPIService
      .sendSyncGatewaySaveAttachmentRequest(documentPath, base64Data, filename)
      .map((response: Response) => {
        // if we have a json doc, return the json result (most results)
        // note: content-type header can also include charset=utf-8 data, so use .includes()
        if (response.headers.get('Content-Type').includes('application/json')) {
          return response.json();
        }

        // otherwise,response could be anything, so just return the response object
        // and we can add more special cases as needed in the future
        return response;
      })
      .catch((error: any) => {
        if (error.status === 401) {
          this.uiEventService.dispatch(new UnauthorizedMessage());
          throw new Error('unauthenticated request');
        }
        return Observable.throw(error || 'Server error');
      });
  }

  sendUpdateMultipleDocumentsRequest(bucket: string, docs: any[]): Observable<IBulkUpdateResult> {
    const documentPath = `${bucket}/_bulk_docs`;

    const modifiedDate = SyncGatewayService.formatDateForCouchbase();
    const modifiedBy = this.currentUserEmail || '';

    const encodedDocs = docs.map(doc => {
      doc['modified_date'] = modifiedDate;
      doc['modified_by'] = modifiedBy;
      this.encodeForCouchbase(doc);
      return doc;
    });

    const body = {
      docs: encodedDocs,
      new_edits: true
    };

    const requestOptions = new RequestOptions({
      headers: this.getHeadersByFileType('json'),
      // behavior: get newest data, merge in additions from `doc`, save it
      body: body
    });

    return this.sendRequest(documentPath, RequestMethod.Post, requestOptions);
  }

  // --- View Requests ---

  sendViewRequest(
    bucket: string,
    design: string,
    viewName: string,
    key?: string,
    viewQueryParams?: Object
  ): Observable<any[]> {
    const path = `${bucket}/_design/${design}/_view/${viewName}`;
    const query = new URLSearchParams();

    // always append stale false, otherwise newly added records will not be available
    // until after an intial view request is made
    query.append('stale', 'false');

    // if optional key is passed, send that along too and look for a specific view record
    if (key && key.length) {
      query.append('key', `"${key}"`); // keys need those quotes around the key for some reason
    }

    if (viewQueryParams) {
      Object.keys(viewQueryParams).forEach(paramKey =>
        query.append(paramKey, viewQueryParams[key])
      );
    }

    return this.sendRequest(
      `${path}?${query.toString()}`,
      RequestMethod.Get,
      new RequestOptions()
    ).map((viewResponse: { total_rows: number; rows: any[] }) => {
      // when total_rows is 0, rows is already an empty array
      // rows can be null if a reducer is used /w no results
      return viewResponse.rows || [];
    });
  }

  getReducerData(bucket, viewName, queryOpt = {}) {
    const query = new URLSearchParams();
    query.append('stale', 'false');

    Object.keys(queryOpt).forEach(key => query.append(key, queryOpt[key]));

    const requestOptions = new RequestOptions({
      headers: this.getHeadersByFileType('json'),
      url: `${environment.portal.apiURL}/api/reduce_view/${bucket}/${viewName}/${query.toString()}`,
      method: RequestMethod.Get
    });

    const req = new Request(requestOptions);
    return this.http
      .request(req)
      .map(
        (response: Response): any[] => {
          const json = response.json();
          const res = json.response;
          const rows = res.rows;
          return rows || [];
        }
      )
      .catch((error: any) => {
        if (error.status === 401) {
          this.uiEventService.dispatch(new UnauthorizedMessage());
          throw new Error('unauthenticated request');
        }
        return Observable.throw(error || 'Server error');
      });
  }

  // --- send actual request ---

  private sendRequest(
    path: string,
    method: RequestMethod = RequestMethod.Get,
    requestOptions: RequestOptions = new RequestOptions()
  ) {
    if (
      ![RequestMethod.Get, RequestMethod.Put, RequestMethod.Post, RequestMethod.Delete].includes(
        method
      )
    ) {
      return Observable.throw(new Error(`Unknown request method '${method}'`));
    }

    path = SyncGatewayService.normalizeUrl(path);

    const gatewayOptions = { method, data: requestOptions.body };

    if (requestOptions.headers && requestOptions.headers.has('Content-Type')) {
      gatewayOptions['contentType'] = requestOptions.headers.get('Content-Type');
    }

    this.clearCacheByPath(path, path.includes('_bulk_docs'));

    return this.portalAPIService
      .sendSyncGatewayRequest(path, gatewayOptions)
      .map((response: Response) => {
        // if we have a json doc, return the json result (most results)
        // note: content-type header can also include charset=utf-8 data, so use .includes()
        if (response.headers.get('Content-Type').includes('application/json')) {
          return response.json();
        }

        // otherwise,response could be anything, so just return the response object
        // and we can add more special cases as needed in the future
        return response;
      })
      .catch((error: any) => {
        if (error.status === 401) {
          this.uiEventService.dispatch(new UnauthorizedMessage());
          throw new Error('unauthenticated request');
        }
        if (error.status === 409) {
          this.clearCacheByPath(path);
        }
        return Observable.throw(error || 'Server error');
      });
  }

  // --- build request options ---

  private getHeadersByFileType(fileType: string) {
    const headers = new Headers();

    if (fileType.length) {
      switch (fileType.toLowerCase()) {
        case 'json':
          headers.append('Content-Type', 'application/json');
          break;
        case 'png':
          headers.append('Content-Type', 'image/png');
          break;
        case 'jpg':
        case 'jpeg':
          headers.append('Content-Type', 'image/jpeg');
          break;
      }
    }

    return headers;
  }

  // --- json encode / decode ---

  private encodeForCouchbase(doc: any) {
    // do we need to do any JSON encoding here? (I don't think so, just return doc for now)
    const copy = Object.assign({}, doc);

    if (copy._attachments === null) {
      delete copy._attachments;
    }

    return copy;
  }

  private decodeFromCouchbase(response: Response) {
    return response.json();
  }

  // --- helper functions ---

  private documentPath(bucket: string, doc: Object, opts = {}) {
    const options = Object.assign(
      {},
      { documentId: false, attachmentName: '', addRevision: false },
      opts
    );

    let path = `/${bucket}/`;

    if (options.documentId) {
      path += options.documentId;
    } else if (doc['_id']) {
      path += doc['_id'];
    } else if (doc['id']) {
      path += doc['id'];
    } else {
      console.log('Not able to determine document ID');
    }

    if (options.attachmentName) {
      path += `/${options.attachmentName}`;
    }

    if (options.addRevision) {
      path += `?rev=${doc['_rev']}`;
    }

    return path;
  }

  private getFileExtension(filename) {
    return filename
      .split('.')
      .pop()
      .toLowerCase();
  }

  private clearCacheByPath(path: string, isBulkUpdate: boolean = false) {
    const bucket = path.indexOf('/') > -1 ? path.split('/')[1] : path;
    delete SyncGatewayService.cache[bucket];
  }

  private getUsernameFromEmail(email: string): string {
    return email
      ? encodeURIComponent(email)
          .toLowerCase()
          .replace(/%/g, '_')
      : '';
  }
}
