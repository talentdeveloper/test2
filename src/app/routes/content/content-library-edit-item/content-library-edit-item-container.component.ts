import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ContentLibraryInterfaces as CLI, ContentItem } from '../../../model/content-library';
import { ContentLibraryBaseContainerComponent } from '../content-library-base/content-library-base-container.component';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { ContentLibraryService } from '../../../core/content-library/content-library.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

@Component({
  selector: 'app-content-library-edit-item-container',
  templateUrl: './content-library-edit-item-container.component.html',
  styleUrls: []
})
export class ContentLibraryEditItemContainerComponent extends ContentLibraryBaseContainerComponent
  implements OnInit {
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
    this.onInit().subscribe(() => {});
  }

  submit(submittedItem: CLI.IChangeEvent) {
    console.log(submittedItem);
    if (submittedItem.saveContentItem.cancelled) {
      this.router.navigate(['content', 'library', 'folder', this.urlPath, 'item', this.contentId]);
      return;
    }

    const contentItem = submittedItem.saveContentItem.contentItem;
    const contentFile = submittedItem.saveContentItem.file;
    const tileImage = submittedItem.saveContentItem.tileImageBase64Data;

    this.contentLibraryService
      .upsertContentItem(contentItem, tileImage)
      .mergeMap((updatedItem: ContentItem) => {
        const item = new ContentItem(updatedItem);
        return this.contentLibraryService.uploadContentFile(item, contentFile);
      })
      .subscribe(() => {
        this.dispatchChangeMessage(true, 'Content item update successful!');
        this.router.navigate([
          'content',
          'library',
          'folder',
          this.urlPath,
          'item',
          this.contentId
        ]);
      });
  }
}
