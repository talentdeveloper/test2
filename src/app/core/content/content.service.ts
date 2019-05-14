import * as _ from 'lodash';
import * as moment from 'moment';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { UUID } from 'angular2-uuid';

import { AuthenticationService } from '../../core/authentication/authentication.service';
import { SyncGatewayService, CONTENT_BUCKET } from '../sync-gateway/sync-gateway.service';
import {
  ACTIVE_DATE_FORMAT,
  LICENSE_DATE_FORMAT,
  IActiveDateRange,
  contentStatus,
  contentTypes,
  IContentProducts
} from '../../model/content/base-content';
import { Content } from '../../model/content/content';
import { ContentChangeFeedService } from '../../core/content/content-change-feed.service';
import { Container } from '../../model/content/container';
import { UiEventMessage, UiEventService } from '../ui-event-service/ui-event-service';
import { ToasterMessage } from '../ui-event-service/ui-toaster-message';
import { ContentLoadedMessage } from '../ui-event-service/ui-content-loaded';
import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { ContentChangedMessage, RefreshRootMessage } from '../ui-event-service/ui-content-tree';
import { ROLE_VIEW_CONTENT } from '../../model/role/role';
import { RoleService } from '../role/role.service';
import { QueueUploadMessage } from '../ui-event-service/ui-queue-upload';

import { IUser } from '../../model/user/user';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';

export const ROOT_NODE_ID = '1';
export const TILE_IMAGE_FILENAME = 'tile_image';

const CONTENT_CHANGE_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

export interface IContentMap {
  [key: string]: Content | Container;
}

@Injectable()
export class ContentService {
  // everything is cached within `content`
  // this saves extra roundtrip times back to couch directly or a compute filter process
  // this will definitely create an unforeseeable bug in the future
  // but its in exchange for reduced load on the couch server, and such a bug should be fixed
  // while preserving a browser in-memory cache of the working item
  private content = null;
  private getAllContentObservable: Observable<Array<Content | Container>> = null;
  private refreshCache = false;

  private changeFeedSubscription: Observable<UiEventMessage>;
  private contentMap: IContentMap = null;

  private contentChanges: {
    [itemId: string]: {
      changeType: string;
      tileImageBase64Data?: string;
    };
  } = {};

  private deletedContentMap: IContentMap = {};

  constructor(
    protected authenticationService: AuthenticationService,
    protected changeFeedService: ContentChangeFeedService,
    protected roleService: RoleService,
    protected syncGatewayService: SyncGatewayService,
    protected uiEventService: UiEventService
  ) {
    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      if (clearCacheMessage.clearAllCaches) {
        this.clearCache();
      }
    });
  }

  clearCache() {
    this.refreshCache = true;
    this.getAllContentObservable = null;
  }

  startChangeFeed() {
    const user = this.authenticationService.currentUser().value;
    // Don't start the change feed if the user is not logged in
    // or the user is not an iN2L user/admin
    if (!user || !this.roleService.currentUserHasRoles(ROLE_VIEW_CONTENT)) {
      this.changeFeedService.close();
      return;
    }

    if (this.changeFeedService.feedIsOpen()) {
      return;
    }

    this.changeFeedService.startContentChangeWatch();

    this.uiEventService.subscribe(ContentChangedMessage, changedContentMessage => {
      if (changedContentMessage.doc.type === 'library-folder') {
        return;
      }

      this.updateCache(
        changedContentMessage.contentId,
        changedContentMessage.doc,
        changedContentMessage.doc._rev,
        changedContentMessage.deleted
      );
      this.uiEventService.dispatch(
        new RefreshRootMessage(changedContentMessage.contentId, changedContentMessage.deleted)
      );
    });
  }

  getAllContent(): Observable<Array<Content | Container>> {
    if (!this.refreshCache && this.content && this.content.length) {
      return Observable.of(this.content);
    }

    if (!this.refreshCache && this.getAllContentObservable) {
      return this.getAllContentObservable;
    }

    this.getAllContentObservable = this.syncGatewayService
      .getAll(CONTENT_BUCKET)
      .flatMap((contentItems: ISyncGatewayModel[]) => {
        this.refreshCache = false;
        // cache content
        this.contentMap = {};
        this.content = contentItems
          .filter((item: Content | Container) => item.type === 'root_container' || !!item.parent_id)
          .map((item: Content | Container) => this.resolveType(item));

        this.contentMap = this.content.reduce((map, curr) => {
          map[curr._id] = curr;
          return map;
        }, {});

        this.uiEventService.dispatch(new ContentLoadedMessage());

        this.getAllContentObservable = null;

        return Observable.of(this.content);
      })
      .share();

    return this.getAllContentObservable;
  }

  // this is a O(log n) operation, browser perf will vary based on content bucket size
  getItems(idList: string[]): Observable<Array<Content | Container>> {
    return this.getAllContent().flatMap(data => {
      // deterministic search
      const items = data.filter(item => idList.some(id => id === item._id));
      // preserve order
      return Observable.of(idList.map(id => items.filter(item => item._id === id)[0]));
    });
  }

  getItem(itemId: string): Observable<Content | Container> {
    return this.getAllContent().flatMap(() => {
      const item = this.contentMap[itemId];
      return Observable.of(item);
    });
  }

  getContentMap(): Observable<IContentMap> {
    return this.getAllContent().flatMap((items: Array<Content | Container>) =>
      Observable.of(this.contentMap)
    );
  }

  getDeletedContentMap(): Observable<IContentMap> {
    return Observable.of(this.deletedContentMap);
  }

  getRawItem(itemId: string): Observable<Content | Container> {
    return this.syncGatewayService
      .sendGetDocumentRequest(CONTENT_BUCKET, itemId)
      .flatMap(item => this.updateCache(itemId, this.resolveType(item), item._rev));
  }

  getAllRawItems(): Observable<Array<Content | Container>> {
    this.clearCache();
    return this.getAllContent();
  }

  getContentItemCount(): Observable<Number> {
    return this.getAllContent().flatMap(() => {
      const contentItems = this.content.filter(item => item instanceof Content);
      return Observable.of(contentItems.length);
    });
  }

  createItem(
    parentId: string,
    item: Content | Container,
    tileImageBase64Data?: string
  ): Observable<Content | Container> {
    if (!parentId) {
      throw new Error('`parentId` must be a valid primary key to create content');
    }

    // generate a primary key for content insertion
    item._id = item._id || UUID.UUID();
    item.parent_id = parentId;
    item.library_path = this.getLibraryPath(item);
    this.updateCache(item._id, item, null);

    // Update parent children and parentMap
    this.addChildItem(<Container>this.contentMap[parentId], item._id);

    // Add products to active dates
    if (item.isContent()) {
      item.active_dates.forEach(range => {
        range.products = (<Content>item).products;
      });
    }

    // Update related items
    this.recalculateContainerProductStatusActiveDates(parentId);

    // Mark the item to be saved
    this.markItemToBeSaved(CONTENT_CHANGE_TYPES.CREATE, item._id, tileImageBase64Data);
    this.markItemToBeSaved(CONTENT_CHANGE_TYPES.UPDATE, parentId);

    return this.sendContentChangesChanges().flatMap(() => {
      return this.getItem(item._id);
    });
  }

  updateItem(
    item: Content | Container,
    tileImageBase64Data?: string
  ): Observable<Content | Container> {
    item.library_path = this.getLibraryPath(item);

    return this.updateCache(item._id, item, item._rev).flatMap(updatedItem => {
      // Add products to active dates
      if (item.isContent()) {
        item.active_dates.forEach(range => {
          range.products = (<Content>item).products;
        });
      }

      // Update parent children and parentMap
      this.recalculateParentContainerProductStatusActiveDates(item._id);

      this.markItemToBeSaved(CONTENT_CHANGE_TYPES.UPDATE, item._id, tileImageBase64Data);

      return this.sendContentChangesChanges().flatMap(() => {
        return this.getItem(item._id);
      });
    });
  }

  uploadContentFile(content: Content, file: File) {
    let key;

    // only override the key if none exists
    if (content.s3_key && content.s3_key.length > 0) {
      key = content.s3_key;
    } else {
      key = `${UUID.UUID()}-${file.name.replace(/\s/g, '_')}`;
    }

    this.uiEventService.dispatch(
      new QueueUploadMessage({ content: content, s3_key: key, file: file })
    );

    return Observable.of(content);
  }

  deleteItem(item: Content | Container): Observable<boolean> {
    return this.updateCache(item._id, item, item._rev)
      .flatMap(updatedItem => {
        // Update parent children and parentMap
        this.recalculateContainerProductStatusActiveDates(item.parent_id);

        this.markItemToBeSaved(CONTENT_CHANGE_TYPES.DELETE, item._id);

        return this.sendContentChangesChanges();
      })
      .flatMap(() => {
        return Observable.of(true);
      });
  }

  deleteItemWithDescendants(itemId: string): Observable<boolean> {
    // find and mark all items to delete
    const descendantIds = this.getAllDescendantIdsOfItem(itemId).filter(
      id => !!this.content.find(c => c._id === id)
    );
    descendantIds.forEach(id => {
      this.markItemToBeSaved(CONTENT_CHANGE_TYPES.DELETE, id);
    });

    this.markItemToBeSaved(CONTENT_CHANGE_TYPES.DELETE, itemId);

    // update parent children
    if (itemId !== ROOT_NODE_ID) {
      const parentItem = <Container>this.contentMap[this.contentMap[itemId].parent_id];
      this.removeChildItem(parentItem, itemId);
      this.markItemToBeSaved(CONTENT_CHANGE_TYPES.UPDATE, parentItem._id);
    }

    // update parent active dates
    this.recalculateParentContainerProductStatusActiveDates(itemId);

    return this.sendContentChangesChanges().flatMap(() => {
      return Observable.of(true);
    });
  }

  moveItem(
    itemId: string,
    previousParentId: string,
    newParentId: string,
    position: number
  ): Observable<any> {
    const item = this.contentMap[itemId];
    const previousParent = <Container>this.contentMap[previousParentId];
    const newParent =
      previousParentId === newParentId ? previousParent : <Container>this.contentMap[newParentId];

    // remove id from previous parent
    this.removeChildItem(previousParent, item._id);

    // no children?
    if (!newParent.children || newParent.children.length === 0) {
      newParent.children = [item._id];
    } else {
      const currentIndex = newParent.children.indexOf(item._id);

      if (currentIndex >= 0) {
        // protect against harmful reorders
        if (position >= newParent.children.length || position < 0) {
          throw new Error(
            'Invalid target index: ' + position + ' of ' + (newParent.children.length - 1)
          );
        }

        // move existing id to the target position
        newParent.children.splice(position, 0, newParent.children.splice(currentIndex, 1)[0]);
      } else {
        // add new id to the target position
        newParent.children.splice(position, 0, item._id);
      }
    }

    // Update parentId
    item.parent_id = newParentId;

    this.updateCache(item._id, item, item._rev);
    this.updateCache(previousParent._id, previousParent, previousParent._rev);
    this.updateCache(newParent._id, newParent, newParent._rev);

    this.markItemToBeSaved(CONTENT_CHANGE_TYPES.UPDATE, previousParentId);
    if (previousParentId !== newParentId) {
      this.recalculateContainerProductStatusActiveDates(previousParentId);
      this.recalculateContainerProductStatusActiveDates(newParentId);
      this.markItemToBeSaved(CONTENT_CHANGE_TYPES.UPDATE, newParentId);
    }

    return this.sendContentChangesChanges();
  }

  getAncestorTitles(itemId: string, titles: string[] = []): Observable<string[]> {
    return this.getItem(itemId).flatMap(item => {
      if (!item) {
        console.log('failing here');
      }

      if (
        !item ||
        !item.parent_id ||
        item.parent_id === ROOT_NODE_ID ||
        !this.contentMap[item.parent_id]
      ) {
        return Observable.of(titles);
      }

      if (this.contentMap[item.parent_id].title) {
        titles.push(this.contentMap[item.parent_id].title);
      }

      return this.getAncestorTitles(item.parent_id, titles);
    });
  }

  resolveType(item): Container | Content {
    if (item instanceof Content || item instanceof Container) {
      return item;
    }

    if (item._id === ROOT_NODE_ID || item.type === contentTypes.CONTAINER) {
      return new Container(item);
    }

    if (!item.type) {
      console.log('does not have a type');
    }

    if (item.type === contentTypes.CONTENT) {
      return new Content(item);
    }

    // alert end user there's a data issue
    const error = `Could not cast type ${item.type} from ID: ${item._id}`;

    this.uiEventService.dispatch(new ToasterMessage({ body: error, type: 'error' }));

    throw new Error(error);
  }

  // Get the IDs of all content items descendant of this container
  // Includes multiple levels of descendants
  private getAllDescendantIdsOfItem(itemId: string): string[] {
    const item = this.contentMap[itemId];
    if (!item || item.type === contentTypes.CONTENT) {
      return [];
    }

    const container = <Container>item;
    if (!container.children || !container.children.length) {
      return [];
    }

    return _.uniq(
      container.children.reduce((prev, childId): string[] => {
        return prev.concat(childId, this.getAllDescendantIdsOfItem(childId));
      }, [])
    );
  }

  private recalculateParentContainerProductStatusActiveDates(itemId: string) {
    const parentId = this.contentMap[itemId].parent_id;
    this.recalculateContainerProductStatusActiveDates(parentId);
  }

  private recalculateContainerProductStatusActiveDates(containerId: string) {
    if (containerId === ROOT_NODE_ID) {
      return;
    }

    const container = this.contentMap[containerId];
    const descendantIds = this.getAllDescendantIdsOfItem(containerId);
    const descendantItems = this.content.filter(
      c => descendantIds.includes(c._id) && c instanceof Content
    );
    const isApproved = descendantItems.reduce(
      (prev: boolean, item: Content | Container) =>
        prev || item.content_status === contentStatus.APPROVED,
      false
    );

    const newValues = descendantItems.reduce(
      (prev: { activeDates: IActiveDateRange[]; products: IContentProducts }, item: Content) => {
        prev.products.engage = prev.products.engage || item.products.engage;
        prev.products.focus = prev.products.focus || item.products.focus;
        prev.products.rehab = prev.products.rehab || item.products.rehab;

        // active dates are irrelevant on QA items
        if (item.content_status === contentStatus.QA) {
          return prev;
        }

        let activeDates = item.active_dates;

        const expirationDate = moment(item.license_expiration_date, LICENSE_DATE_FORMAT);
        if (expirationDate.isValid()) {
          activeDates = activeDates.reduce((dates: IActiveDateRange[], range: IActiveDateRange) => {
            const start = moment(range.start, ACTIVE_DATE_FORMAT);
            if (start.isSameOrAfter(expirationDate)) {
              return dates;
            }

            const end = moment(range.end, ACTIVE_DATE_FORMAT);
            if (end.isAfter(expirationDate)) {
              range.end = expirationDate.format(ACTIVE_DATE_FORMAT);
            }

            return dates.concat(range);
          }, []);
        }

        prev.activeDates = prev.activeDates.concat(activeDates);
        return prev;
      },
      { activeDates: [], products: { engage: false, focus: false, rehab: false } }
    );

    container.active_dates = newValues.activeDates;
    container.products = newValues.products;
    container.content_status = isApproved ? contentStatus.APPROVED : contentStatus.QA;
    this.markItemToBeSaved(CONTENT_CHANGE_TYPES.UPDATE, containerId);

    if (!container.parent_id) {
      return;
    }

    this.recalculateContainerProductStatusActiveDates(container.parent_id);
  }

  private updateCache(
    itemId: string,
    item: Content | Container,
    rev: string,
    isDeleted: boolean = false
  ): Observable<Content | Container | boolean> {
    if (isDeleted) {
      if (this.content) {
        const deletedItem = this.contentMap[itemId];
        if (deletedItem) {
          this.deletedContentMap[itemId] = deletedItem;
        }
        this.content = this.content.filter(c => c._id !== itemId);
        delete this.contentMap[itemId];
      }

      return Observable.of(true);
    }

    if (this.content) {
      const isContainer = this.contentMap[itemId] instanceof Container || item instanceof Container;
      const oldItem =
        isContainer && this.contentMap[itemId]
          ? <Container>(this.contentMap[itemId] || new Container())
          : <Content>(this.contentMap[itemId] || new Content());

      const oldRev = Number((oldItem._rev || '0').split('-')[0]);
      const newRev = Number((rev || '0').split('-')[0]);
      const latestRev = newRev > oldRev ? rev : oldItem._rev;

      if (oldItem._id) {
        _.merge(oldItem, item);
        oldItem.active_dates = item.active_dates;

        if (isContainer) {
          (<Container>oldItem).children = (<Container>item).children;
        } else {
          (<Content>oldItem).keywords = (<Content>item).keywords;
          (<Content>oldItem).products = (<Content>item).products;
          (<Content>oldItem).skill_level = (<Content>item).skill_level;
        }

        oldItem._rev = latestRev;
      } else {
        item._rev = latestRev;
        if (!(item instanceof Content || item instanceof Container)) {
          item = this.resolveType(item);
        }

        this.content.push(item);
        this.contentMap[item._id] = item;
      }
    }

    return this.getItem(itemId);
  }

  private markItemToBeSaved(changeType: string, itemId: string, tileImageBase64Data?: string) {
    // Mark the item to be saved
    if (!this.contentChanges[itemId]) {
      this.contentChanges[itemId] = {
        changeType: changeType,
        tileImageBase64Data: tileImageBase64Data
      };
    } else if (tileImageBase64Data) {
      this.contentChanges[itemId].tileImageBase64Data = tileImageBase64Data;
    }
  }

  private sendContentChangesChanges(): Observable<boolean> {
    const contentRequestObservables = [Observable.of(null)]; // ensuring there is always something in the list
    const attachmentRequestObservables = [Observable.of(null)];

    Object.keys(this.contentChanges).forEach(itemId => {
      switch (this.contentChanges[itemId].changeType) {
        case CONTENT_CHANGE_TYPES.CREATE:
        case CONTENT_CHANGE_TYPES.UPDATE:
          const contentObservable = this.sendUpdateRequest(
            itemId,
            this.contentChanges[itemId].tileImageBase64Data
          );
          contentRequestObservables.push(contentObservable);
          break;
        case CONTENT_CHANGE_TYPES.DELETE:
          const deleteObservable = this.sendDeleteRequest(itemId);
          contentRequestObservables.push(deleteObservable);
          break;
        default:
        // do nothing
      }
    });

    return Observable.forkJoin(contentRequestObservables)
      .flatMap(() => Observable.forkJoin(attachmentRequestObservables))
      .flatMap(() => {
        this.contentChanges = {};
        return Observable.of(true);
      });
  }

  private sendUpdateRequest(
    itemId: string,
    tileImageBase64Data?: string
  ): Observable<Content | Container> {
    const item = this.contentMap[itemId];

    // Mark the content item as locally modified
    this.changeFeedService.recordLocalModification(itemId);

    return this.syncGatewayService
      .sendUpdateDocumentRequest(CONTENT_BUCKET, item)
      .flatMap(result => this.updateCache(itemId, item, result.rev))
      .flatMap(updatedItem => {
        if (tileImageBase64Data) {
          return this.sendAttachmentRequest(itemId, tileImageBase64Data);
        }

        return this.getItem(itemId);
      })
      .catch(error => {
        this.clearCache();

        this.uiEventService.dispatch(
          new ToasterMessage({
            body: 'This request could not be completed. Please refresh and try again.',
            type: 'error'
          })
        );

        return this.getItem(itemId);
      });
  }

  private sendAttachmentRequest(
    itemId: string,
    tileImageBase64Data: string
  ): Observable<Content | Container> {
    const item = this.contentMap[itemId];

    // Mark the content item as locally modified
    this.changeFeedService.recordLocalModification(itemId);

    // update the tile image
    return this.syncGatewayService
      .sendUpdateDocumentAttachmentRequest(
        CONTENT_BUCKET,
        item,
        tileImageBase64Data,
        TILE_IMAGE_FILENAME
      )
      .flatMap(result => {
        return this.updateCache(itemId, item, result.rev);
      })
      .flatMap(() => this.getItem(itemId))
      .catch(error => {
        this.clearCache();

        this.uiEventService.dispatch(
          new ToasterMessage({
            body: 'This request could not be completed. Please refresh and try again.',
            type: 'error'
          })
        );

        return this.getItem(itemId);
      });
  }

  private sendDeleteRequest(itemId: string): Observable<boolean> {
    const deletedItem = this.deletedContentMap[itemId] || this.contentMap[itemId];

    // Mark the content item as locally modified
    this.changeFeedService.recordLocalModification(itemId);

    return this.syncGatewayService
      .sendDeleteDocumentRequest(CONTENT_BUCKET, deletedItem)
      .flatMap((result: { id: string; rev: string; ok: boolean }) => Observable.of(!!result.ok));
  }

  private addChildItem(container: Container, childId: string) {
    const children = new Set(container.children || []);
    children.add(childId);
    container.children = Array.from(children);
  }

  private removeChildItem(container: Container, childId: string) {
    const children = new Set(container.children || []);
    children.delete(childId);
    container.children = Array.from(children);
  }

  private getLibraryPath(item: Content | Container): string {
    if (item.type !== contentTypes.CONTENT) {
      return null;
    }

    const path = [];
    let parent = this.contentMap[item.parent_id];
    while (parent && parent.type !== contentTypes.ROOT_CONTAINER) {
      path.unshift(parent.title);
      parent = this.contentMap[parent.parent_id];
    }

    return '/' + path.join('/');
  }
}
