import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Container } from '../../../model/content/container';
import { ContentService, IContentMap } from '../../../core/content/content.service';
import {
  DeleteContainerMessage
} from '../../../core/ui-event-service/ui-content';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ActiveContentItemMessage } from '../../../core/ui-event-service/ui-active-content-item';
import { ContentLoadedMessage } from '../../../core/ui-event-service/ui-content-loaded';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { ContentChangedMessage } from '../../../core/ui-event-service/ui-content-tree';

const COMPONENT_NAME = 'view-content';

@Component({
  selector: 'view-container',
  templateUrl: './view-container.component.html',
  styleUrls: ['./view-container.component.scss']
})
export class ViewContainerComponent implements OnDestroy, OnInit {

  container : Container;
  id : string;

  panelSubtitle: string;

  changeDisabled = false;
  changeFeedSubscription: any;

  contentMap: IContentMap

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected contentService : ContentService,
    protected uiEventService : UiEventService,
    protected loaderService : LoaderService
  ) {

  }

  ngOnInit() {
    this.route.params.subscribe((v : { id : string }) => {
      this.id = v.id;

      this.uiEventService.dispatch(new ActiveContentItemMessage({id: v.id}));

      this.loadContainer();

      this.setPanelSubtitle();
    });

    this.route.params.last();

    this.changeFeedSubscription = this.uiEventService.subscribe(ContentChangedMessage, changedContentMessage => {
      if (changedContentMessage.contentId !== this.id) return;

      if (!changedContentMessage.deleted) {
        this.container = <Container> this.contentService.resolveType(changedContentMessage.doc);
      }

      if (changedContentMessage.isLocalModification) {
        return;
      }
      
      if (changedContentMessage.deleted) {
        this.changeDisabled = true;
        this.uiEventService.dispatch( new ToasterMessage({
          body: 'This container has been deleted by another user. This page is no longer valid.',
          type: 'warning'
        }));
        return;
      }

      this.uiEventService.dispatch( new ToasterMessage({
        body: 'This container has been updated by another user. The container information has been refreshed.',
        type: 'warning'
      }));
    });

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
    this.uiEventService.dispatch(new DeleteContainerMessage({id, title}));
  }

  getStatus() {
    return this.container.getStatus({contentMap: this.contentMap});
  }

  private loadContainer() {
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.contentService.getContentMap(),
      this.contentService.getItem(this.id)
    ).subscribe(([contentMap, container]: [IContentMap, Container]) => {
      this.contentMap = contentMap;
      this.container = container;
      this.loaderService.stop(COMPONENT_NAME);
    }, () => {
      this.loaderService.stop(COMPONENT_NAME);
    });
  }

  private setPanelSubtitle() {
    this.contentService.getAncestorTitles(this.id)
      .subscribe((titles: string[]) => this.panelSubtitle = titles.reverse().join(' > '));
  }
}
