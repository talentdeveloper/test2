import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { Device } from '../../../model/device/device';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


@Component({
    selector: 'app-admin-account-device-list',
    templateUrl: './admin-account-device-list.component.html',
    styles: [
        '.valign-top { vertical-align: top !important }',
        '.account-cell { width: 160px }',
        '.action-cell { width: 80px }'
    ]
})
export class AdminAccountDeviceListComponent implements OnInit {

    dataLoaded = false;
    accounts: Account[] = [];
    facilities: Facility[] = [];
    devices: Device[] = [];

    constructor(
        private accountService: AccountService,
        private facilityService: FacilityService,
        private deviceService: DeviceService,
        private router: Router,
        private uiEventService: UiEventService
    ) { }

    ngOnInit() {
        // load all accounts and residents
        Observable.forkJoin(
            this.accountService.getAccounts(),
            this.facilityService.getAllFacilities(),
            this.deviceService.getAllDevices()
        ).subscribe((results: any[]) => {
            this.accounts = results[0];
            this.facilities = results[1];
            this.devices = results[2];
        }, error => {
            this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        },
        () => {
            this.dataLoaded = true;
        });
    }

    getAccountFacilities(accountId: string): Facility[] {
        return this.facilities.filter(f => f.account_id === accountId);
    }

    getFacilityDevices(facilityId: string): Device[] {
        return this.devices.filter(d => d.facility_id === facilityId);
    }
}
