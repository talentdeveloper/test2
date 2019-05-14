import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { FacilityService } from '../../../core/facility/facility.service';
import { Message, ResidentMessage } from '../../../model/message/message';
import { MessageService } from '../../../core/message/message.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'send-resident-message';

@Component({
    selector: 'send-resident-message',
    templateUrl: './send-resident-message.component.html'
})
export class SendResidentMessageComponent implements OnInit {

    accountId: string;
    facilityId: string;
    residentId: string;
    message: ResidentMessage = new ResidentMessage();

    constructor(
        protected breadcrumbService: BreadcrumbService,
        protected facilityService: FacilityService,
        protected messageService: MessageService,
        protected activatedRoute: ActivatedRoute,
        protected uiEventService: UiEventService,
        protected loaderService: LoaderService
    ) {

    }

    ngOnInit() {
        this.activatedRoute.params.subscribe((v: { id: string, facility_id: string, resident_id: string }) => {
            this.accountId = v.id;
            this.facilityId = v.facility_id;
            this.residentId = v.resident_id;

            this.message.recipient_id = v.resident_id;
        });

        this.activatedRoute.params.last();

        this.loaderService.start(COMPONENT_NAME);

        this.facilityService.getFacility(this.facilityId)
            .subscribe((facility) => {
                this.message.from_name = facility.profile.name;
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
}
