import * as _ from 'lodash';

import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Device } from '../../../model/device/device';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

const COMPONENT_NAME = 'edit-device';

@Component({
    selector: 'app-edit-device',
    templateUrl: './edit-device.component.html'
})
export class EditDeviceComponent implements OnInit {
    account: Account;
    accountId: string;
    device: Device;
    deviceId: string;
    facilityId: string;
    facility: Facility;

    constructor(
        protected accountService: AccountService,
        protected breadcrumbService: BreadcrumbService,
        protected deviceService: DeviceService,
        protected facilityService: FacilityService,
        protected location: Location,
        protected route: ActivatedRoute,
        protected uiEventService: UiEventService,
        protected loaderService: LoaderService
    ) { }

    ngOnInit() {
        this.route.params.subscribe((v: { id: string, facility_id: string, device_id: string }) => {
            this.accountId = v.id;
            this.facilityId = v.facility_id;
            this.deviceId = v.device_id;

            if (v.id && v.facility_id && v.device_id) {
                this.loadData(v.id, v.facility_id, v.device_id);
            }
        });

        this.route.params.last();
    }

    loadData(accountId: string, facilityId: string, deviceId: string) {
        this.loaderService.start(COMPONENT_NAME);

        Observable.forkJoin(
            this.accountService.getAccount(accountId),
            this.facilityService.getFacility(this.facilityId),
            this.deviceService.getRawDevice(this.deviceId)
        ).subscribe(([account, facility, device]) => {
            this.account = account;
            this.facility = facility;
            this.device = device;

            this.loaderService.stop(COMPONENT_NAME);

            if (!this.device) {
                this.uiEventService.dispatch( new ToasterMessage({
                    body: `Could not load a device with id ${this.deviceId}`,
                    type: 'error'
                }) );
                return;
            }
            
            this.breadcrumbService.updateBreadcrumbs([
                { label: _.get(this.account, 'profile.account_name', 'Account'), url: `/account/${accountId}` },
                { label: 'Facilities', url: `/account/${accountId}/facility/list` },
                { label: _.get(this.facility, 'profile.name', 'Facility'), url: `/account/${accountId}/facility/${facilityId}` },
                { label: 'Devices', url: `/account/${accountId}/facility/${facilityId}/devices` },
                { label: `Edit ${this.device.serial_number}`, url: '' }
            ]);
        }, error => {
            this.loaderService.stop(COMPONENT_NAME);
            this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        });
    }

    onSuccess({ device, previousDevice }) {
        this.location.back();
    }

    onCancel() {
        this.location.back();
    }
}
