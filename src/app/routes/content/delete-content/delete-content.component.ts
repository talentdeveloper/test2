import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { DeleteContentMessage } from '../../../core/ui-event-service/ui-content';
import { ContentService } from '../../../core/content/content.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { RefreshRootMessage } from '../../../core/ui-event-service/ui-content-tree';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'delete-content';

@Component({
    selector: 'delete-content',
    templateUrl: './delete-content.component.html',
    styleUrls: ['./delete-content.component.scss']
})
export class DeleteContentComponent implements OnInit {
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
        protected loaderService: LoaderService
    ) { }

    ngOnInit() {
        this.uiEventService.subscribe(DeleteContentMessage, (message) => {
            this.id = message.id;
            this.retypeValue = message.title;
            this.retypeModel = '';
            this.modal.show();
            this.loading = false;
        });
    }

    deleteMessage() {
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