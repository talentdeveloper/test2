import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import {
    DeleteContainerMessage
} from '../../../core/ui-event-service/ui-content';
import { ContentService } from '../../../core/content/content.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import {
    RefreshRootMessage
} from '../../../core/ui-event-service/ui-content-tree';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'delete-container';

@Component({
    selector: 'delete-container',
    templateUrl: './delete-container.component.html',
    styleUrls: ['./delete-container.component.scss']
})
export class DeleteContainerComponent implements OnInit {
    id : string;
    loading = false;
    retypeValue = '';
    retypeModel = '';

    @ViewChild('modal')
    modal : ModalDirective;

    constructor(
        protected contentService : ContentService,
        protected uiEventService : UiEventService,
        protected router : Router,
        protected loaderService : LoaderService
    ) { }

    ngOnInit() {
        this.uiEventService.subscribe(DeleteContainerMessage, (message) => {
            this.id = message.id;
            this.retypeValue = message.title;
            this.retypeModel = '';
            this.modal.show();
            this.loading = false;
        });
    }

    deleteItem() {
        if (this.retypeModel !== this.retypeValue) {
            return;
        }

        this.loading = true;

        this.loaderService.start(COMPONENT_NAME);

        this.contentService.deleteItemWithDescendants(this.id)
            .subscribe((parentId) => {
                this.modal.hide();

                this.router.navigateByUrl(`/content/catalog`);

                this.loaderService.stop(COMPONENT_NAME);
            }, (e) => {
                this.uiEventService.dispatch(new ToasterMessage({
                    body: e.message,
                    type: 'error'
                }));

                this.loaderService.stop(COMPONENT_NAME);
            }, () => {
                this.loading = false;
            });
    }
}