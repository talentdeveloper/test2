import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Content } from '../../../model/content/content';
import { ContentService, IContentMap } from '../../../core/content/content.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { DeleteContentMessage } from '../../../core/ui-event-service/ui-content';
import { ContentChangedMessage } from '../../../core/ui-event-service/ui-content-tree';
import { LoaderService } from '../../../core/loader/loader.service';
import { ActiveContentItemMessage } from '../../../core/ui-event-service/ui-active-content-item';
import { ContentLoadedMessage } from '../../../core/ui-event-service/ui-content-loaded';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';

const COMPONENT_NAME = 'view-content';

@Component({
  selector: 'view-content',
  templateUrl: './view-content.component.html',
  styleUrls: ['./view-content.component.scss']
})
export class ViewContentComponent implements OnDestroy, OnInit {
  content: Content;
  id: string;

  panelSubtitle: string;

  changeDisabled = false;
  changeFeedSubscription: any;

  contentMap: IContentMap;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected contentService: ContentService,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((v: { id: string }) => {
      this.id = v.id;

      this.uiEventService.dispatch(new ActiveContentItemMessage({ id: v.id }));

      this.loadContent();

      this.setPanelSubtitle();
    });

    this.route.params.last();

    this.changeFeedSubscription = this.uiEventService.subscribe(
      ContentChangedMessage,
      changedContentMessage => {
        if (changedContentMessage.contentId !== this.id) {
          return;
        }

        if (!changedContentMessage.deleted) {
          this.content = <Content>this.contentService.resolveType(changedContentMessage.doc);
        }

        if (changedContentMessage.isLocalModification) {
          return;
        }

        if (changedContentMessage.deleted) {
          this.changeDisabled = true;
          this.uiEventService.dispatch(
            new ToasterMessage({
              body:
                'This content item has been deleted by another user. This page is no longer valid.',
              type: 'warning'
            })
          );
          return;
        }

        this.loadContent();
        this.uiEventService.dispatch(
          new ToasterMessage({
            body:
              'This content item has been updated by another user. The content information has been refreshed.',
            type: 'warning'
          })
        );
      }
    );

    this.uiEventService.subscribe(ContentLoadedMessage, () => {
      this.setPanelSubtitle();
    });
  }

  ngOnDestroy() {
    if (this.changeFeedSubscription && this.changeFeedSubscription.unsubscribe) {
      this.changeFeedSubscription.unsubscribe();
    }
  }

  openDeletePrompt(id, title) {
    this.uiEventService.dispatch(new DeleteContentMessage({ id, title }));
  }

  getStatus(): string {
    return this.content.getStatus();
  }

  productList(): string {
    return Object.keys(this.content.products)
      .filter(key => this.content.products[key])
      .join(', ');
  }

  private loadContent() {
    Observable.forkJoin(
      this.contentService.getContentMap(),
      this.contentService.getItem(this.id)
    ).subscribe(
      ([contentMap, content]: [IContentMap, Content]) => {
        this.contentMap = contentMap;
        this.content = content;
        this.loaderService.stop(COMPONENT_NAME);
      },
      () => {
        this.loaderService.stop(COMPONENT_NAME);
      }
    );
  }

  private setPanelSubtitle() {
    this.contentService
      .getAncestorTitles(this.id)
      .subscribe((titles: string[]) => (this.panelSubtitle = titles.reverse().join(' > ')));
  }
}
