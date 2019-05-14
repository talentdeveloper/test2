import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import {
    DeleteDeviceMessage,
    RefreshDeviceListMessage
} from '../../../core/ui-event-service/ui-device';
import { Device } from '../../../model/device/device';
import { DeviceStatus } from '../../../model/device/device-status';
import { DeviceService } from '../../../core/device/device.service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'delete-device';

@Component({
    selector: 'app-delete-device',
    templateUrl: './delete-device.component.html',
    styleUrls: ['./delete-device.component.scss']
})
export class DeleteDeviceComponent implements OnInit, OnDestroy {
    loading = false;
    device: Device;
    deviceStatus: DeviceStatus;
    active = false;
    accountId = '';
    facilityId = '';
    isDeleteEnabled = true;

    @ViewChild('modal')
    modal: ModalDirective;

    constructor(
        protected deviceService: DeviceService,
        protected uiEventService: UiEventService,
        protected router: Router,
        protected loaderService: LoaderService
    ) {
    }

    ngOnInit() {
        this.active = true;

        this.uiEventService.subscribe(DeleteDeviceMessage, (message) => {
            if (this.active) {
                this.device = message.device;
                this.deviceStatus = message.deviceStatus;
                this.accountId = message.accountId;
                this.facilityId = message.facilityId;
                this.modal.show();
                this.loading = false;
            }
        });
    }

    ngOnDestroy() {
        this.active = false;
    }

    deleteItem() {
        this.isDeleteEnabled = false;
        this.loaderService.start(COMPONENT_NAME);

        this.deviceService.removeDevice(this.device)
            .subscribe(() => {
                this.modal.hide();
                this.uiEventService.dispatch(new RefreshDeviceListMessage);
                this.loaderService.stop(COMPONENT_NAME);
                this.uiEventService.dispatch( new ToasterMessage({
                    body: `Device ${this.device.serial_number} has been removed`,
                    type: 'success'
                }) );
                this.isDeleteEnabled = true;
            }, (error) => {
                this.uiEventService.dispatch(new ToasterMessage({body: error, type: 'error'}));
                this.loaderService.stop(COMPONENT_NAME);
                this.isDeleteEnabled = true;
            });
    }
}
