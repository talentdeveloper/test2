import * as _ from 'lodash';

import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { Device, deviceProduct } from '../../../model/device/device';
import { DeviceDetail } from '../../../model/device-detail/device-detail';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';

@Component({
  selector: 'app-device-status-list',
  templateUrl: './device-status-list.component.html',
  styles: [
    '.active-column { font-weight: bold; text-decoration: underline; }',
    '.order-icon { display: none }',
    '.active-column .order-icon { display: inline }',
    '.type-cell { width: 160px }',
    '.action-cell { width: 140px }'
  ]
})
export class DeviceStatusListComponent implements OnInit {
  @Input() devices : DeviceDetail[] = [];
  search : string = '';
  columnTypes = {
    serialNumber: 0,
    account: 1,
    facility: 2,
    nickname: 3,
    product: 4
  };

  activeColumn = this.columnTypes.account;
  asc = true;

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private facilityService: FacilityService) {}

  ngOnInit() {
    // subscribe to router event
    this.activatedRoute.queryParams.subscribe((params : any) => {
      this.search = params.q || '';
    });
  }

  setSort(type) {
    if (type === this.activeColumn) {
      this.asc = !this.asc;
    } else {
      this.activeColumn = type;
      this.asc = true;
    }
  }

  filteredDevices() : DeviceDetail[] {
    const isExactSearch = this.search[0] === '"' && this.search[this.search.length - 1] === '"';
    const search = this.search.trim().toLowerCase().replace(/"/g, '');

    return this.devices
      .filter((device) => {
        if (search.length > 0) {
          const accountName = _.get(device, 'account_name', '').toLowerCase();
          const facilityName = _.get(device, 'facility_name', '').toLowerCase();
          const deviceName = (device.serial_number || '').toLowerCase();
          const nickname = (device.nickname || '').toLowerCase();

          if (isExactSearch) {
            return (
              accountName === search ||
              facilityName === search ||
              deviceName === search ||
              nickname === search
            );
          }

          return (
            accountName.indexOf(search) >= 0 ||
            facilityName.indexOf(search) >= 0 ||
            deviceName.indexOf(search) >= 0 ||
            nickname.indexOf(search) >= 0
          );
        }

        return true;
      })
      .sort((a : DeviceDetail, b : DeviceDetail) => {
        let compareA: string;
        let compareB: string;

        switch (this.activeColumn) {
          case this.columnTypes.account:
            compareA = a.account_name.trim();
            compareB = b.account_name.trim();

            break;
          case this.columnTypes.facility:
            compareA = a.facility_name.trim();
            compareB = b.facility_name.trim();

            break;
          case this.columnTypes.nickname:
            compareA = a.nickname.trim();
            compareB = b.nickname.trim();

            break;
          case this.columnTypes.serialNumber:
            compareA = a.serial_number.trim();
            compareB = b.serial_number.trim();

            break;
        }

        if (!this.asc) {
          const tmp = compareA;
          compareA = compareB;
          compareB = tmp;
        }
        return compareA.toLocaleLowerCase().localeCompare(compareB.toLocaleLowerCase());
      });
  }

  getProductName(device: DeviceDetail): string {
    return device.product ? device.product : deviceProduct.FOCUS;
  }
}
