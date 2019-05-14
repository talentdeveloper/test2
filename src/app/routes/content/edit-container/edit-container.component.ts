import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Container } from '../../../model/content/container';
import { ContentService } from '../../../core/content/content.service';
import { IContainerFormSubmitEvent } from '../shared/container-form/container-form.component';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ActiveContentItemMessage } from '../../../core/ui-event-service/ui-active-content-item';
import { ContentChangedMessage } from '../../../core/ui-event-service/ui-content-tree';

const COMPONENT_NAME = 'edit-container';

@Component({
    selector: 'edit-container',
    templateUrl: './edit-container.component.html'
})
export class EditContainerComponent implements OnDestroy, OnInit {

    container : Container;
    id : string;
    errorMessage : string;
    submitEnabled : boolean = true;

    changeFeedSubscription: any;

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected contentService : ContentService,
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
                .subscribe((container : Container) => this.container = container);
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
                    body: 'This container has been deleted by another user. This page is no longer valid.',
                    type: 'warning'
                }));
                return;
            }

            this.uiEventService.dispatch( new ToasterMessage({
                body: 'This container has been updated by another user. Please refresh the page to update the container information.',
                type: 'warning'
            }));

        });
    }

    ngOnDestroy() {
        if (this.changeFeedSubscription && this.changeFeedSubscription.unsubscribe) {
            this.changeFeedSubscription.unsubscribe();
        }
    }

    onSubmit(event : IContainerFormSubmitEvent) {
        this.submitEnabled = false;

        const container = event.container;

        this.loaderService.start(COMPONENT_NAME);

        this.contentService.updateItem(container, event.uploadedTileImage.base64Data)
            .subscribe(() => {
                this.uiEventService.dispatch( new ToasterMessage({
                    body: 'Content container has been updated',
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
