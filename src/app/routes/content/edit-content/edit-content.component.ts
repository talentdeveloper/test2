import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Content } from '../../../model/content/content';
import { ContentService } from '../../../core/content/content.service';
import { IContentFormSubmitEvent } from '../shared/content-form/content-form.component';
import { PortalAPIService } from '../../../core/portal-api/portal-api.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ActiveContentItemMessage } from '../../../core/ui-event-service/ui-active-content-item';
import { ContentChangedMessage } from '../../../core/ui-event-service/ui-content-tree';

const COMPONENT_NAME = 'edit-content';

@Component({
  selector: 'edit-content',
  templateUrl: './edit-content.component.html'
})
export class EditContentComponent implements OnDestroy, OnInit {

  content : Content;
  s3Key : string;
  s3Etag : string;
  id: string;
  errorMessage : string;
  submitEnabled : boolean = true;

  changeFeedSubscription: any;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected contentService : ContentService,
    protected portalApi : PortalAPIService,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {

  }

  ngOnInit() {
    this.route.params.subscribe((v : { id : string }) => {
      this.id = v.id;

      this.uiEventService.dispatch(new ActiveContentItemMessage({id: v.id}));

      this.contentService
        .getItem(this.id)
        .subscribe((content : Content) => {
          this.content = content;
          // keep a reference of the old s3 key and etag
          this.s3Key = this.content.s3_key;
          this.s3Etag = this.content.s3_etag;
        });
    });

    this.route.params.last();

    this.changeFeedSubscription = this.uiEventService.subscribe(ContentChangedMessage, changedContentMessage => {
      if (changedContentMessage.contentId !== this.id) return;

      if (changedContentMessage.isLocalModification) {
        return;
      }

      this.submitEnabled = false;

      if (changedContentMessage.deleted) {
        this.uiEventService.dispatch( new ToasterMessage({
          body: 'This content item has been deleted by another user. This page is no longer valid.',
          type: 'warning'
        }));
        return;
      }

      this.uiEventService.dispatch( new ToasterMessage({
        body: 'This content item has been updated by another user. Please refresh the page to update the content information.',
        type: 'warning'
      }));

    });
  }

  ngOnDestroy() {
    if (this.changeFeedSubscription && this.changeFeedSubscription.unsubscribe) {
      this.changeFeedSubscription.unsubscribe();
    }
  }

  onSubmit(event : IContentFormSubmitEvent) {
    this.submitEnabled = false;

    this.loaderService.start(COMPONENT_NAME);

    if (event.error) {
      this.errorMessage = event.error;
      this.submitEnabled = true;
      this.loaderService.stop(COMPONENT_NAME);
    } else {
      this.uiEventService.dispatch(new ToasterMessage({
        body: 'Content item has been updated',
        type: 'success'
      }));

      this.loaderService.stop(COMPONENT_NAME);

      this.router.navigateByUrl(`/content/catalog/(item:content/${event.content._id})`);
    }
  }
}
