import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Container } from '../../../model/content/container'
import { ContentService } from '../../../core/content/content.service';
import { IContainerFormSubmitEvent } from '../shared/container-form/container-form.component';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'add-container';

@Component({
    selector: 'add-container',
    templateUrl: './add-container.component.html'
})
export class AddContainerComponent implements OnInit {

    container : Container = new Container();
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
        });

        this.route.params.last();
    }

    onSubmit(event : IContainerFormSubmitEvent) {
        this.submitEnabled = false;

        this.loaderService.start(COMPONENT_NAME);

        const container = event.container;
        this.contentService.createItem(this.parentId, container, event.uploadedTileImage.base64Data)
            .subscribe(() => {
                this.uiEventService.dispatch( new ToasterMessage({
                    body: 'Content container has been added',
                    type: 'success'
                }) );

                this.router.navigateByUrl(`/content/catalog/(item:container/${container._id})`);
                this.loaderService.stop(COMPONENT_NAME);
            }, (error) => {
                this.errorMessage = error;
                this.submitEnabled = true;
                this.loaderService.stop(COMPONENT_NAME);
            });
    }
}
