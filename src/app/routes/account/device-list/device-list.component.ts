import * as _ from 'lodash';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import {
  DeleteDeviceMessage,
  RefreshDeviceListMessage
} from '../../../core/ui-event-service/ui-device';
import { ClearCacheMessage } from '../../../core/ui-event-service/ui-clear-cache';
import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Device, deviceProduct } from '../../../model/device/device';
import { DeviceStatus, DeviceStatusFactory } from '../../../model/device/device-status';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { LoaderService } from '../../../core/loader/loader.service';
import {
  ROLE_ADD_DEVICE,
  ROLE_DELETE_DEVICE,
  ROLE_EDIT_DEVICE,
  ROLE_MOVE_DEVICE
} from '../../../model/role/role';
import { RoleService, IPermissions } from '../../../core/role/role.service';
import { ACCOUNT_BUCKET } from '../../../core/sync-gateway/sync-gateway.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

const COMPONENT_NAME = 'device-list';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styles: [ '.action-cell { width: 250px }' ]
})
export class DeviceListComponent implements OnInit, OnDestroy {

  account: Account;
  facility: Facility;
  devices: Device[] = [];
  deviceStatuses: DeviceStatus[] = [];
  accountId: string;
  permissions: IPermissions;
  facilityId: string;
  dataLoaded: boolean;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private breadcrumbService: BreadcrumbService,
    private deviceService: DeviceService,
    private facilityService: FacilityService,
    private loaderService: LoaderService,
    private uiEventService: UiEventService,
    private roleService: RoleService
  ) { }

  ngOnInit() {
    if (this.dataLoaded) {
      return;
    }

    this.route.params.subscribe((params: { id: string, facility_id: string }) => {
      this.accountId = params.id;
      this.facilityId = params.facility_id;

      if (params.id && params.facility_id) {
        this.loadDevices();
      }
    });

    this.route.params.last();

    this.permissions = this.roleService.currentUserPermissionsObject([
      { keyName: 'canAddDevice', role: ROLE_ADD_DEVICE },
      { keyName: 'canDeleteDevice', role: ROLE_DELETE_DEVICE },
      { keyName: 'canEditDevice', role: ROLE_EDIT_DEVICE },
      { keyName: 'canMoveDevice', role: ROLE_MOVE_DEVICE }
    ]);

    this.uiEventService.subscribe(RefreshDeviceListMessage, () => {
      this.loadDevices();
    });
  }

  ngOnDestroy() {
    this.dataLoaded = false;
  }

  loadDevices() {
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getFacility(this.facilityId),
      this.deviceService.getDevicesByFacilityId(this.facilityId),
      this.deviceService.getDeviceStatusesByFacilityId(this.facilityId)
    ).subscribe(([account, facility, devices, deviceStatuses]) => {
      this.account = account;
      this.facility = facility;
      this.devices = devices
      .sort((a: Device, b: Device) => {
        return (a.serial_number || '')
          .toLowerCase()
          .localeCompare(
            (b.serial_number || '').toLowerCase()
          );
      });;
      this.deviceStatuses = deviceStatuses;

      this.breadcrumbService.updateBreadcrumbs([
        {
          label: _.get(this.account,
          'profile.account_name', 'Account'),
          url: `/account/${this.account._id}`
        },
        { label: 'Facilities', url: `/account/${this.account._id}/facility/list` },
        {
          label: _.get(this.facility,
          'profile.name', 'Facility'),
          url: `/account/${this.account._id}/facility/${this.facility._id}`
        },
        { label: 'Devices', url: '' }
      ]);

      this.dataLoaded = true;
      this.loaderService.stop(COMPONENT_NAME);
    },
    error => {
      this.dataLoaded = true;
      this.loaderService.stop(COMPONENT_NAME);
      this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
    });
  }

  getDeviceStatus(device): DeviceStatus {
    return this.deviceStatuses.find(ds => ds.serial_number === device.serial_number) || DeviceStatusFactory.createFromDevice(device);
  }

  deleteDevicePrompt(device: Device) {
    const deviceStatus = this.deviceStatuses.find(ds => ds.serial_number === device.serial_number);

    this.uiEventService.dispatch(new DeleteDeviceMessage({
      accountId: this.accountId,
      facilityId: this.facilityId,
      device: device,
      deviceStatus: deviceStatus
    }));
  }

  getContentModeName(device: Device): string {
    return device.getContentModeName();
  }

  getProductName(device: Device): string {
    return device.product ? device.product : deviceProduct.FOCUS;
  }
}
