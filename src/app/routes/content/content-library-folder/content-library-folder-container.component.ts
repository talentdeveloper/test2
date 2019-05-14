import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { IApiBulkUpdateResult } from '../../../core/sync-gateway/sync-gateway.service';
import { ContentLibraryInterfaces as CLI, ContentItem } from '../../../model/content-library';
import { ContentLibraryBaseContainerComponent } from '../content-library-base/content-library-base-container.component';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { ContentLibraryService } from '../../../core/content-library/content-library.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

enum DISPLAY_STATES {
  CONTENT_LIBRARY,
  CONTENT_ITEM,
  CONTENT_ITEM_EDIT
}

@Component({
  selector: 'app-content-library-folder-container',
  templateUrl: './content-library-folder-container.component.html',
  styleUrls: []
})
export class ContentLibraryFolderContainerComponent extends ContentLibraryBaseContainerComponent
  implements OnInit {
  static activeFavoritesMap: CLI.IActiveFavoritesMap;
  static contentAnalyticsMap: CLI.IContentAnalyticsMap;

  isSearchResults = false;

  libraryItems: CLI.IContentStatsResult[] = [];
  libraryPaths: string[] = [];

  itemAnalytics: CLI.IContentStatsResult;

  changeFeedSubscription: any;

  constructor(
    activatedRoute: ActivatedRoute,
    breadcrumbService: BreadcrumbService,
    contentLibraryService: ContentLibraryService,
    router: Router,
    uiEventService: UiEventService
  ) {
    super(activatedRoute, breadcrumbService, contentLibraryService, router, uiEventService, false);
  }

  ngOnInit() {
    this.loadActiveFavorites();
    this.loadContentAnalytics();
    this.loadAllLibraryPaths();

    this.onInit().subscribe(() => {
      this.loadPath(this.path);
    });
  }

  updateView(item: CLI.IContentStatsResult) {
    this.isSearchResults = false;
    if (item.doc_type === 'content-item' && item._id) {
      this.itemAnalytics = this.libraryItems.find(value => value._id === item._id);
      this.router.navigate([
        'content',
        'library',
        'folder',
        this.convertPathToUrlPath(item.library_path),
        'item',
        item._id
      ]);
    } else {
      const newPath =
        item.library_path === '/' ? `/${item.title}` : `${item.library_path}/${item.title}`;
      this.loadPath(newPath);
      this.router.navigate(['content', 'library', 'folder', this.convertPathToUrlPath(newPath)]);
    }
  }

  changeEvent(changeEvent: CLI.IChangeEvent) {
    if (changeEvent.error) {
      this.dispatchChangeMessage(false, changeEvent.error.message);
      return;
    }

    if (changeEvent.addEditContentItem) {
      this.router.navigate(['content', 'library', 'folder', this.urlPath, 'additem']);
      return;
    }

    if (changeEvent.addFolder) {
      this.addFolder(changeEvent.addFolder.newFolderName);
      return;
    }

    if (changeEvent.renameFolder) {
      this.renameFolder(changeEvent.renameFolder.oldTitle, changeEvent.renameFolder.newTitle);
      return;
    }

    if (changeEvent.moveItems) {
      this.moveItems(changeEvent.moveItems.newPath, changeEvent.moveItems.items);
      return;
    }

    if (changeEvent.deleteItems) {
      this.deleteItems(changeEvent.deleteItems.libraryItems);
      return;
    }

    if (changeEvent.search) {
      this.loadSearchResults(changeEvent.search.searchText);
    }
  }

  addFolder(title: string) {
    this.contentLibraryService.createFolder(this.path, title).subscribe(
      () => {
        this.loadPath(this.path);
      },
      error => {
        console.log(error);
        this.dispatchChangeMessage(false, 'New folder could not be creation successful!');
      }
    );
  }

  renameFolder(oldTitle: string, newTitle: string) {
    const basePath = this.path === '/' ? this.path : `${this.path}/`;
    this.contentLibraryService
      .updateLibraryPath(basePath + oldTitle, basePath + newTitle)
      .subscribe(
        (results: IApiBulkUpdateResult[]) => {
          const ok = !results.filter(item => !!item.error).length;
          if (!ok) {
            console.log(results);
          }
          this.dispatchChangeMessage(ok, 'Folder rename ' + (ok ? ' successful!' : ' failed.'));
        },
        () => this.dispatchChangeMessage(false, 'Folder rename failed.')
      );
  }

  moveItems(newPath: string, items: CLI.IContentStatsResult[]) {
    const basePath = this.path === '/' ? this.path : `${this.path}/`;
    this.contentLibraryService.moveLibraryItems(this.path, newPath, items).subscribe(
      (results: IApiBulkUpdateResult[]) => {
        const ok = !results.filter(item => !!item.error).length;
        if (!ok) {
          console.log(results);
        }
        this.dispatchChangeMessage(ok, 'Move ' + (ok ? ' successful!' : ' failed.'));
        this.loadPath(this.path);
      },
      () => {
        this.dispatchChangeMessage(false, 'Move failed');
        this.loadPath(this.path);
      }
    );
  }

  deleteItems(items: CLI.IContentStatsResult[]) {
    this.contentLibraryService.deleteLibraryItems(this.path, items).subscribe(
      (results: IApiBulkUpdateResult[]) => {
        const ok = !results.filter(item => !!item.error).length;
        if (!ok) {
          console.log(results);
        }
        this.dispatchChangeMessage(ok, 'Delete ' + (ok ? ' successful!' : ' failed.'));
        this.loadPath(this.path);
      },
      () => {
        this.dispatchChangeMessage(false, 'Delete failed. Please refresh and try again.');
        this.loadPath(this.path);
      }
    );
  }

  private loadPath(path: string) {
    Observable.forkJoin([
      this.loadActiveFavorites(),
      this.loadContentAnalytics(),
      this.contentLibraryService.getContentLibraryItems(path)
    ]).subscribe(
      ([favCounts, analyticsMap, contentResults]: [
        CLI.IActiveFavoritesMap,
        CLI.IContentAnalyticsMap,
        CLI.IContentStatsResult[]
      ]) => {
        this.libraryItems = contentResults;
        // .filter(item => item.doc_type !== 'library-folder');

        this.libraryItems.forEach(item => {
          if (item.doc_type === 'content-item' && item._id) {
            item.active_favorites = favCounts[item._id];
            item.times_accessed = analyticsMap[item._id]
              ? analyticsMap[item._id].times_accessed
              : null;
            item.last_time_used = analyticsMap[item._id]
              ? analyticsMap[item._id].last_time_used
              : null;
          }
        });

        this.path = path;

        this.setBreadcrumbs(path, false);
      },
      () => {
        this.dispatchChangeMessage(
          false,
          'Loading folder contents failed. Please refresh and try again.'
        );
      }
    );
  }

  private loadActiveFavorites(): Observable<CLI.IActiveFavoritesMap> {
    return ContentLibraryFolderContainerComponent.activeFavoritesMap
      ? Observable.of(ContentLibraryFolderContainerComponent.activeFavoritesMap)
      : this.contentLibraryService
          .getActiveFavorites()
          .mergeMap((results: CLI.IActiveFavoritesMap) => {
            ContentLibraryFolderContainerComponent.activeFavoritesMap = results;
            return Observable.of(ContentLibraryFolderContainerComponent.activeFavoritesMap);
          })
          .share();
  }

  private loadContentAnalytics(): Observable<CLI.IContentAnalyticsMap> {
    return ContentLibraryFolderContainerComponent.contentAnalyticsMap
      ? Observable.of(ContentLibraryFolderContainerComponent.contentAnalyticsMap)
      : this.contentLibraryService
          .getContentAnalytics()
          .mergeMap((results: CLI.IContentAnalyticsMap) => {
            ContentLibraryFolderContainerComponent.contentAnalyticsMap = results;
            return Observable.of(ContentLibraryFolderContainerComponent.contentAnalyticsMap);
          })
          .share();
  }

  private loadAllLibraryPaths() {
    this.contentLibraryService.getAllLibraryPaths().subscribe((paths: string[]) => {
      this.libraryPaths = paths;
    });
  }

  private loadSearchResults(searchText: string) {
    if (!searchText) {
      this.isSearchResults = false;
      this.loadPath('/');
      this.router.navigate(['content', 'library', 'folder', this.convertPathToUrlPath('/')]);
      return;
    }

    Observable.forkJoin([
      this.loadActiveFavorites(),
      this.loadContentAnalytics(),
      this.contentLibraryService.getSearchResults(searchText)
    ]).subscribe(
      ([favCounts, analyticsMap, searchResults]: [
        CLI.IActiveFavoritesMap,
        CLI.IContentAnalyticsMap,
        CLI.IContentStatsResult[]
      ]) => {
        this.libraryItems = searchResults;

        this.libraryItems.forEach(item => {
          if (item.doc_type === 'content-item' && item._id) {
            item.active_favorites = favCounts[item._id];
            item.times_accessed = analyticsMap[item._id]
              ? analyticsMap[item._id].times_accessed
              : null;
            item.last_time_used = analyticsMap[item._id]
              ? analyticsMap[item._id].last_time_used
              : null;
          }
        });

        this.path = '/';
        this.isSearchResults = true;
        this.setBreadcrumbs(this.path, false, true);
      },
      () => {
        this.dispatchChangeMessage(
          false,
          'Loading folder contents failed. Please refresh and try again.'
        );
      }
    );
  }
}
