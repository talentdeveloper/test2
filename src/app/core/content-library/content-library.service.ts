import * as _ from 'lodash';
import * as moment from 'moment';

import { Http, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { UUID } from 'angular2-uuid';

import { environment } from '../../../environments/environment';
import {
  SyncGatewayService,
  CONTENT_BUCKET,
  IApiBulkUpdateResult
} from '../sync-gateway/sync-gateway.service';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';
import {
  ContentItem,
  EmptyFolder,
  ContentLibraryConstants as CLC,
  ContentLibraryInterfaces as CLI
} from '../../model/content-library';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { QueueUploadMessage } from '../ui-event-service/ui-queue-upload';

@Injectable()
export class ContentLibraryService {
  private connectApiUrl: string;

  constructor(
    private http: Http,
    private syncGatewayService: SyncGatewayService,
    private uiEventService: UiEventService
  ) {
    this.connectApiUrl = environment.connectApi.url;
  }

  /**
   * Content Library Stats
   */

  getActiveFavorites(): Observable<CLI.IActiveFavoritesMap> {
    return this.http
      .get(`${this.connectApiUrl}/portal-content/activefavorites`)
      .map((result: Response) => result.json());
  }

  getContentAnalytics(): Observable<CLI.IContentAnalyticsMap> {
    return this.http
      .get(`${this.connectApiUrl}/portal-content/analytics`)
      .map((result: Response) => result.json());
  }

  getContentLibraryItems(path: string): Observable<CLI.IContentStatsResult[]> {
    return this.http
      .get(`${this.connectApiUrl}/portal-content/libraryitems?contentpath=${path}`)
      .map((result: Response) => result.json());
  }

  getSearchResults(searchText: string): Observable<CLI.IContentStatsResult[]> {
    return this.http
      .get(`${this.connectApiUrl}/portal-content/search/${encodeURIComponent(searchText)}`)
      .map((result: Response) => result.json());
  }

  getShowAllList(path: string): Observable<CLI.IContentStatsResult[]> {
    return this.http
      .get(`${this.connectApiUrl}/portal-content/libraryitems?contentpath=${path}`)
      .map((result: Response) => result.json());
  }

  getContentItem(contentId: string): Observable<ContentItem> {
    return this.syncGatewayService.get(CONTENT_BUCKET, contentId).map(contentItem => {
      const item = new ContentItem(<CLI.IContentItem>contentItem);
      return item;
    });
  }

  getAllLibraryPaths(): Observable<string[]> {
    return this.http
      .get(`${this.connectApiUrl}/portal-content/librarypaths`)
      .mergeMap((result: Response) => Observable.of(result.json()));
  }

  createFolder(parentPath: string, title: string,folderstate:boolean): Observable<EmptyFolder> {
    const emptyFolder = new EmptyFolder();
    emptyFolder._id = UUID.UUID();
    emptyFolder.created_date = moment().format();
    emptyFolder.library_path = parentPath === '/' ? `/${title}/${folderstate}` : `${parentPath}/${title}/${folderstate}`;
    return this.syncGatewayService
      .upsert(CONTENT_BUCKET, emptyFolder)
      .mergeMap((result: ISyncGatewayModel) => {
        emptyFolder._rev = result._rev;
        return Observable.of(emptyFolder);
      });
  }

  updateLibraryPath(
    oldLibraryPath: string,
    newLibraryPath: string
  ): Observable<IApiBulkUpdateResult[]> {
    return this.http
      .put(`${this.connectApiUrl}/portal-content/librarypaths`, {
        oldLibraryPath: oldLibraryPath,
        newLibraryPath: newLibraryPath
      })
      .map((result: Response) => result.json());
  }

  upsertContentItem(
    contentItem: ContentItem,
    tileImageBase64Data?: string
  ): Observable<ContentItem> {
    if (!contentItem._id) {
      contentItem._id = UUID.UUID();
    }

    return this.syncGatewayService
      .upsert(CONTENT_BUCKET, contentItem)
      .mergeMap((result: ISyncGatewayModel) => {
        contentItem._rev = result._rev;
        if (tileImageBase64Data) {
          console.log("================upsertnowContentItem============",contentItem)
          return this.syncGatewayService
            .sendUpdateDocumentAttachmentRequest(
              CONTENT_BUCKET,
              contentItem,
              tileImageBase64Data,
              CLC.TILE_IMAGE_ATTACHMENT_NAME
            )
            .mergeMap(() => this.getContentItem(contentItem._id));            
        }

        return Observable.of(contentItem);
      });
  }

  moveLibraryItems(
    oldLibraryPath: string,
    newLibraryPath: string,
    items: CLI.IContentStatsResult[]
  ): Observable<IApiBulkUpdateResult[]> {
    return this.http
      .put(`${this.connectApiUrl}/portal-content/librarymove`, {
        oldLibraryPath: oldLibraryPath,
        newLibraryPath: newLibraryPath,
        items: items
      })
      .mergeMap((result: Response) => Observable.of(result.json()));
  }

  deleteLibraryItems(
    libraryPath: string,
    items: CLI.IContentStatsResult[]
  ): Observable<IApiBulkUpdateResult[]> {
    return this.http
      .put(`${this.connectApiUrl}/portal-content/librarydelete`, {
        libraryPath: libraryPath,
        items: items
      })
      .mergeMap((result: Response) => Observable.of(result.json()));
  }

  uploadContentFile(contentItem: CLI.IContentItem, file: File) {
    const key = !!contentItem.s3_key
      ? contentItem.s3_key
      : `${UUID.UUID()}-${file.name.replace(/\s/g, '_')}`;

    this.uiEventService.dispatch(
      new QueueUploadMessage({ content: contentItem, s3_key: key, file: file })
    );
    return Observable.of(contentItem);
  }
}
