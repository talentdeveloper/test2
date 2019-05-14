import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { BreadcrumbService, IBreadcrumb } from '../../../core/breadcrumb/breadcrumb.service';
import { ContentLibraryInterfaces as CLI, ContentItem } from '../../../model/content-library';
import { ContentLibraryService } from '../../../core/content-library/content-library.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';

export class ContentLibraryBaseContainerComponent {
  protected urlPath: string;
  path: string;
  contentId: string;
  contentItem: ContentItem;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected breadcrumbService: BreadcrumbService,
    protected contentLibraryService: ContentLibraryService,
    protected router: Router,
    protected uiEventService: UiEventService,
    private isContentPage: boolean = false
  ) {}

  onInit(): Observable<boolean> {
    return this.activatedRoute.params.mergeMap((params: any) => {
      this.urlPath = params.path;
      this.path = this.convertUrlPathToPath(this.urlPath);

      if (this.isContentPage && params.contentId) {
        this.contentId = params.contentId;

        return this.contentLibraryService
          .getContentItem(this.contentId)
          .mergeMap((contentItem: ContentItem) => {
            this.contentItem = contentItem;
            this.setBreadcrumbs(
              this.path,
              this.isContentPage,
              false,
              this.contentId,
              this.contentItem.title
            );
            return Observable.of(true);
          });
      }

      this.setBreadcrumbs(this.path, this.isContentPage);
      return Observable.of(true);
    });
  }

  protected setBreadcrumbs(
    path: string,
    isContentPage: boolean,
    isSearchPage: boolean = false,
    contentId?: string,
    contentTitle?: string
  ) {
    const rootBreadcrumb: IBreadcrumb = {
      label: 'Content Library',
      url: '/content/library/folder/~'
    };
    let lastBreadcrumb;
    const breadcrumbs: IBreadcrumb[] = [rootBreadcrumb];

    if (isSearchPage) {
      lastBreadcrumb = {
        label: 'Search',
        url: ''
      };
    } else {
      const pathArray = path === '/' ? [] : path.split('/');
      for (let i = 1; i < pathArray.length; i++) {
        const crumb: IBreadcrumb = {
          label: pathArray[i],
          url: `/content/library/folder/${pathArray.slice(0, i + 1).join('~')}`
        };
        breadcrumbs.push(crumb);
      }

      if (!isContentPage) {
        this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
        return;
      }

      lastBreadcrumb = {
        label: contentId && contentTitle ? contentTitle : 'New Content Item',
        url: ''
      };
    }

    breadcrumbs.push(lastBreadcrumb);

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }

  protected convertPathToUrlPath(path: string): string {
    return path.replace(/\//g, '~');
  }

  protected convertUrlPathToPath(urlPath: string): string {
    return urlPath.replace(/~/g, '/');
  }

  protected dispatchChangeMessage(ok: boolean, eventDescription: string) {
    if (ok) {
      this.uiEventService.dispatch(
        new ToasterMessage({
          body: eventDescription,
          type: 'success'
        })
      );
      return;
    }
    this.uiEventService.dispatch(
      new ToasterMessage({
        body: eventDescription,
        type: 'error'
      })
    );
  }
}
