import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

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
  selector: 'app-content-library-item-container',
  templateUrl: './content-library-item-container.component.html',
  styleUrls: []
})
export class ContentLibraryItemContainerComponent extends ContentLibraryBaseContainerComponent
  implements OnInit {
  static activeFavoritesMap: CLI.IActiveFavoritesMap;
  static contentAnalyticsMap: CLI.IContentAnalyticsMap;

  libraryItems: CLI.IContentStatsResult[] = [];
  libraryPaths: string[] = [];

  itemAnalytics: CLI.IContentStatsResult;
  displayState: DISPLAY_STATES;

  changeFeedSubscription: any;

  constructor(
    activatedRoute: ActivatedRoute,
    breadcrumbService: BreadcrumbService,
    contentLibraryService: ContentLibraryService,
    router: Router,
    uiEventService: UiEventService
  ) {
    super(activatedRoute, breadcrumbService, contentLibraryService, router, uiEventService, true);
  }

  ngOnInit() {
    this.loadActiveFavorites();
    this.loadContentAnalytics();
    this.loadAllLibraryPaths();

    this.onInit().subscribe(() => {
      this.loadContentItemStats();
    });
  }

  changeEvent(changeEvent: CLI.IChangeEvent) {
    if (changeEvent.addEditContentItem) {
      this.router.navigate([
        'content',
        'library',
        'folder',
        this.urlPath,
        'item',
        this.contentId,
        'edit'
      ]);
      return;
    }

    if (changeEvent.deleteItems) {
      this.deleteItem();
    }
  }

  deleteItem() {
    this.contentLibraryService
      .deleteLibraryItems(this.contentItem.library_path, [
        {
          _id: this.contentItem._id,
          doc_type: 'content-item',
          library_path: this.contentItem.library_path,
          title: this.contentItem.title,
          total_content_items: null,
          created_date: this.contentItem.created_date,
          last_time_used: null,
          times_accessed: null,
          active_favorites: null,
          products: this.contentItem.products
        }
      ])
      .subscribe(
        result => {
          console.log(result);
          this.dispatchChangeMessage(true, 'Content item delete successful!');
          this.router.navigate(['content', 'library', 'folder', this.urlPath]);
        },
        error => {
          console.log(error);
          this.dispatchChangeMessage(
            false,
            'Content item delete failed. Please refresh and try again.'
          );
        }
      );
  }

  private loadContentItemStats() {
    const existingStat = this.libraryItems.find(stat => stat._id === this.contentId);
    if (!existingStat) {
      this.contentLibraryService
        .getContentLibraryItems(this.contentItem.library_path)
        .subscribe((libraryStats: CLI.IContentStatsResult[]) => {
          this.itemAnalytics = libraryStats.find(stat => stat._id === this.contentItem._id);
        });
    }
  }

  private loadActiveFavorites(): Observable<CLI.IActiveFavoritesMap> {
    return ContentLibraryItemContainerComponent.activeFavoritesMap
      ? Observable.of(ContentLibraryItemContainerComponent.activeFavoritesMap)
      : this.contentLibraryService
          .getActiveFavorites()
          .mergeMap((results: CLI.IActiveFavoritesMap) => {
            ContentLibraryItemContainerComponent.activeFavoritesMap = results;
            return Observable.of(ContentLibraryItemContainerComponent.activeFavoritesMap);
          })
          .share();
  }

  private loadContentAnalytics(): Observable<CLI.IContentAnalyticsMap> {
    return ContentLibraryItemContainerComponent.contentAnalyticsMap
      ? Observable.of(ContentLibraryItemContainerComponent.contentAnalyticsMap)
      : this.contentLibraryService
          .getContentAnalytics()
          .mergeMap((results: CLI.IContentAnalyticsMap) => {
            ContentLibraryItemContainerComponent.contentAnalyticsMap = results;
            return Observable.of(ContentLibraryItemContainerComponent.contentAnalyticsMap);
          })
          .share();
  }

  private loadAllLibraryPaths() {
    this.contentLibraryService.getAllLibraryPaths().subscribe((paths: string[]) => {
      this.libraryPaths = paths;
    });
  }
}
