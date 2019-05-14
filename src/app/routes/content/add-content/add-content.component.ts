import { Component, OnInit } from '@angular/core';
import { UUID } from 'angular2-uuid';

import { Content } from '../../../model/content/content';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../../../core/content/content.service';
import { IContentFormSubmitEvent } from '../shared/content-form/content-form.component';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'add-content';

@Component({
  selector: 'add-content',
  templateUrl: './add-content.component.html'
})
export class AddContentComponent implements OnInit {

  content : Content;
  parentId : string;
  errorMessage : string;
  submitEnabled : boolean = true;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected contentService : ContentService,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {

  }

  ngOnInit() {
    this.route.params.subscribe((v : { parent_id : string }) => {
      this.parentId = v.parent_id;

      this.content = new Content();
      this.content.parent_id = this.parentId;
    });

    this.route.params.last();
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
        body: 'Content item has been added',
        type: 'success'
      }));
      this.loaderService.stop(COMPONENT_NAME);
      this.router.navigateByUrl(`/content/catalog/(item:content/${event.content._id})`);
    }
  }
}
