import * as _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

import { Device } from '../../../model/device/device';
import { DeviceStatus } from '../../../model/device/device-status';
import { DeviceDetail, IDeviceDetail } from '../../../model/device-detail/device-detail';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { AccountService } from '../../../core/account/account.service';
import { Account } from '../../../model/account/account';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'view-device-statuses';
const REQUESTS_PER_BATCH = 4;

@Component({
  selector: 'app-view-device-statuses',
  templateUrl: './view-device-statuses.component.html'
})
export class ViewDeviceStatusesComponent implements OnInit {
  devices: DeviceDetail[] = [];
  deviceStatuses: DeviceStatus[] = [];
  accounts: Account[] = [];
  facilities: Facility[] = [];
  id: string;

  constructor(protected route : ActivatedRoute,
        protected router : Router,
        protected accountService : AccountService,
        protected deviceService: DeviceService,
        protected facilityService: FacilityService,
        protected uiEventService : UiEventService,
        protected loaderService : LoaderService) {
  }

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.accountService.getAccounts(),
      this.facilityService.getAllFacilities(),
      this.deviceService.getAllDevices(),
      this.deviceService.getAllDeviceStatuses()
    ).subscribe(([accounts, facilities, devices, deviceStatuses]) => {
      this.accounts = accounts;
      this.facilities = facilities;
      this.devices = devices.map((device) => new DeviceDetail(device));
      this.deviceStatuses = deviceStatuses;

      this.devices.forEach(d => {
        if (d.account_id) {
          const account = this.accounts.find(a => a._id === d.account_id);
          d.account_name = _.get(account, 'profile.account_name', '');
        }
        
        if (d.facility_id) {
          const facility = this.facilities.find(f => f._id === d.facility_id);
          d.facility_name = _.get(facility, 'profile.name', '');
        }
      });

      // stagger device info queries so we don't blow up couchbase
      const queries = this.devices
        .reduce((arr, device, index) => {
          if (index % REQUESTS_PER_BATCH === 0) {
            arr.push([]);
          }

          arr[arr.length - 1].push(this.loadDeviceFileStatus(device._id));

          return arr;
        }, [])
        .map(batch => Observable.forkJoin(batch));

      // invoke staggered queries
      Observable.from(queries)
        .concatAll()
        .subscribe(
          () => {
            this.loaderService.stop(COMPONENT_NAME);
          },
          error => {
            this.uiEventService.dispatch(new ToasterMessage({ body: error, type: 'error' }));
            this.loaderService.stop(COMPONENT_NAME);
          });
    });
  }

  loadDeviceFileStatus(deviceId) {
    return this.deviceService
      .getDeviceDownloadStatus(deviceId)
      .flatMap((response) => {
        if (response[0] && response[0].value) {
          this.updateDevice(deviceId, response[0].value);
        } else {
          this.updateDevice(deviceId, {});
        }

        return [response];
      });
  }

  updateDevice(deviceId, stats : IDeviceDetail) {
    this.devices = this.devices.map((device) : DeviceDetail => {
      if (device._id === deviceId) {
        return Object.assign(device, {
          files_queued: stats.files_queued || 0,
          files_downloading: stats.files_downloading || 0,
          files_downloaded: stats.files_downloaded || 0,
          files_errored: stats.files_errored || 0,
          loaded: true
        });
      } else {
        return device;
      }
    })
  }
}
