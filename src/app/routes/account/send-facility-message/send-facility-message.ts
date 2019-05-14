import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { FacilityMessage, Message } from '../../../model/message/message';
import { MessageService } from '../../../core/message/message.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

const COMPONENT_NAME = 'send-facility-message';

@Component({
    selector: 'app-send-facility-message',
    templateUrl: './send-facility-message.html'
})
export class SendFacilityMessageComponent implements OnInit {

    accountId: string;
    facilityId: string;
    facilityName: string;
    message: FacilityMessage = new FacilityMessage();

    constructor(
        protected breadcrumbService: BreadcrumbService,
        protected facilityService: FacilityService,
        protected messageService: MessageService,
        protected route: ActivatedRoute,
        protected uiEventService: UiEventService,
        protected loaderService: LoaderService
    ) { }

    ngOnInit() {
        this.route.params.subscribe((v: { id: string, facility_id: string }) => {
            this.accountId = v.id;
            this.facilityId = v.facility_id;
        });

        this.route.params.last();

        this.loaderService.start(COMPONENT_NAME);

        this.facilityService.getFacility(this.facilityId)
            .subscribe((facility: Facility) => {
                this.facilityName = facility.profile.name;
                this.initNewFacilityMessage();
                this.loaderService.stop(COMPONENT_NAME);
            }, () => {
                this.loaderService.stop(COMPONENT_NAME);
            });
    }

    onSubmit(message: Message) {
        this.loaderService.start(COMPONENT_NAME);

        this.messageService.sendMessage(message)
            .subscribe(() => {
                this.message = message;
                this.loaderService.stop(COMPONENT_NAME);
            }, () => {
                this.loaderService.stop(COMPONENT_NAME);
            });
    }

    resetForm() {
        this.initNewFacilityMessage();
    }

    private initNewFacilityMessage() {
        this.message = new FacilityMessage();
        this.message.recipient_id = this.facilityId;
        this.message.from_name = this.facilityName;
    }
}
