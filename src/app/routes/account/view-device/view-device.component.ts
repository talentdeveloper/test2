import * as _ from 'lodash';
import * as moment from 'moment';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { DeleteDeviceMessage, RefreshDeviceListMessage } from '../../../core/ui-event-service/ui-device';
import { Device, DEVICE_RESIDENT_MODE_ALL } from '../../../model/device/device';
import { DeviceStatus, DeviceStatusFactory } from '../../../model/device/device-status';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { Resident, RESIDENT_STATUS_ACTIVE } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import {
    ROLE_DELETE_DEVICE,
    ROLE_EDIT_DEVICE,
    ROLE_MOVE_DEVICE
} from '../../../model/role/role';
import { RoleService, IPermissions } from '../../../core/role/role.service';

import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

const COMPONENT_NAME = 'view-device';

@Component({
    selector: 'app-view-device',
    templateUrl: './view-device.component.html'
})
export class ViewDeviceComponent implements OnInit {

    account: Account;
    activeResidents: Resident[] = [];
    device: Device;
    deviceStatus: DeviceStatus;
    accountId: string;
    deviceId: string;
    facility: Facility;
    facilityId: string;
    permissions: IPermissions;
    residentConfiguration = '';
    residents: Resident[];
    termsOfUseSignedDate: string;

    constructor (
        private accountService: AccountService,
        private activatedRoute: ActivatedRoute,
        private breadcrumbService: BreadcrumbService,
        private deviceService: DeviceService,
        private facilityService: FacilityService,
        private loaderService: LoaderService,
        private residentService: ResidentService,
        private roleService: RoleService,
        private router: Router,
        private uiEventService: UiEventService
    ) { }

    ngOnInit() {
        this.activatedRoute.params.subscribe((params: { id: string, facility_id: string, device_id: string }) => {
            this.accountId = params.id;
            this.facilityId = params.facility_id;
            this.deviceId = params.device_id;

            this.loadData();
        });

        this.activatedRoute.params.last();

        this.permissions = this.roleService.currentUserPermissionsObject([
            { keyName: 'canDeleteDevice', role: ROLE_DELETE_DEVICE },
            { keyName: 'canEditDevice', role: ROLE_EDIT_DEVICE },
            { keyName: 'canMoveDevice', role: ROLE_MOVE_DEVICE }
        ]);

        this.uiEventService.subscribe(RefreshDeviceListMessage, () => {
            this.router.navigateByUrl( `/account/${this.accountId}/facility/${this.facilityId}/devices` );
        });
    }

    deleteDevicePrompt() {
        this.uiEventService.dispatch(new DeleteDeviceMessage({
            accountId: this.accountId,
            facilityId: this.facilityId,
            device: this.device,
            deviceStatus: this.deviceStatus
        }));
    }

    private loadData(): void {
        this.loaderService.start(COMPONENT_NAME);

        Observable.forkJoin(
            this.accountService.getAccount(this.accountId),
            this.facilityService.getFacility(this.accountId),
            this.deviceService.getDevice(this.deviceId)
        ).flatMap(([account, facility, device]) => {
            this.account = account;
            this.facility = facility;
            this.device = device;

            return Observable.forkJoin(
                this.deviceService.getDeviceStatusBySerialNumber(this.device.serial_number),
                this.residentService.getResidentsWithDevice(this.device)
            );
        }).subscribe(([deviceStatus, residents]) => {
            this.deviceStatus = deviceStatus || DeviceStatusFactory.createFromDevice(this.device);
            this.residents = residents.filter(resident => resident.isActive());

            const signedRecord = this.device.getTermsOfUseRecord(this.accountId, this.facilityId) || null;
            this.termsOfUseSignedDate = signedRecord && signedRecord.acceptance_date ? moment(signedRecord.acceptance_date).format('MMMM Do YYYY, h:mm:ss a') : null;

            this.residents.sort((a, b) => {
                const nameA = `${a.first_name} ${a.last_name}`;
                const nameB = `${b.first_name} ${b.last_name}`;
                return nameA.toLowerCase().localeCompare( nameB.toLowerCase() );
            });

            this.activeResidents = this.residents.filter(resident => resident.isActive());

            this.breadcrumbService.updateBreadcrumbs([
                { label: _.get(this.account, 'profile.account_name', 'Account'), url: `/account/${this.accountId}` },
                { label: 'Facilities', url: `/account/${this.accountId}/facility/list` },
                {
                    label: _.get(this.facility, 'profile.name', 'Facility'),
                    url: `/account/${this.accountId}/facility/${this.facilityId}`
                },
                { label: 'Devices', url: `/account/${this.accountId}/facility/${this.facilityId}/devices` },
                { label: this.device.serial_number, url: '' }
            ]);

            // calculate resident configuration
            if ( this.device.resident_mode === DEVICE_RESIDENT_MODE_ALL || this.residents.length > 1 ) {
                this.residentConfiguration = 'Multiple Users';
            } else if ( this.residents.length === 1 ) {
                this.residentConfiguration = 'Single User';
            } else {
                this.residentConfiguration = 'No Users';
            }

            this.loaderService.stop(COMPONENT_NAME);
        },
        error => {
            this.loaderService.stop(COMPONENT_NAME);
            this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        });
    }

    getStatus(property: string): string {
        return this.deviceStatus && this.deviceStatus[property] ? this.deviceStatus[property] : "";
    }
}
