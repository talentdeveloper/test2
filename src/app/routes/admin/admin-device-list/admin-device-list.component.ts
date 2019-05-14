import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { Device } from '../../../model/device/device';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { PortalAPIService } from '../../../core/portal-api/portal-api.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


class SerialNumberFacility {
  _id: string;
  account: {
    _id: string;
    name: string;
  };
  devices: Device[];
  name: string;
}

class SerialNumberRow {
  errors: string[] = [];
  facilities: SerialNumberFacility[] = [];
  residents: Resident[] = [];
  serialNumber: string;

  constructor(serial_number: string) {
    this.serialNumber = serial_number;
  }
}

class DeviceExistsModel {
  client: {
    account_ids: string[],
    exists: boolean,
    response_code: number
  };
  exists: boolean;
  resident: {
    exists: boolean,
    facility_ids: string[],
    response_code: number
  };
  serial_number: string;
}


@Component({
  selector: 'app-admin-device-list',
  templateUrl: './admin-device-list.component.html',
  styles: [
    '.valign-top { vertical-align: top !important }',
    '.action-cell { width: 80px }',
    '.number-cell { width: 240px }',
    '.resident-cell { width: 45% }'
  ]
})
export class AdminDeviceListComponent implements OnInit {

  accounts: Account[] = [];
  facilities: Facility[] = [];
  devices: Device[] = [];
  dataLoaded = false;
  deviceUserList: { client_devices: string[], resident_devices: string[] } = { client_devices: [], resident_devices: [] };
  deviceExistsList: DeviceExistsModel[] = [];
  filteredRows: SerialNumberRow[] = [];
  errorFilterActive = false;
  residents: Resident[] = [];
  rows: SerialNumberRow[] = [];
  search = '';

  constructor(
    private accountService: AccountService,
    private deviceService: DeviceService,
    private facilityService: FacilityService,
    private portalAPIService: PortalAPIService,
    private residentService: ResidentService,
    private router: Router,
    private uiEventService: UiEventService
  ) { }

  ngOnInit() {
    // load all accounts and residents
    Observable.forkJoin(
      this.accountService.getAccounts(),
      this.facilityService.getAllFacilities(),
      this.deviceService.getAllDevices(),
      this.residentService.getAllResidents(),
      this.portalAPIService.getDeviceUserList()
    ).flatMap(results => {
      this.accounts = results[0];
      this.facilities = results[1];
      this.devices = results[2];
      this.residents = results[3];
      this.deviceUserList = results[4];
      
      const serial_numbers = this.getUniqueSerialNumbers();

      return Observable.forkJoin( serial_numbers.map(sn => this.portalAPIService.sendDeviceUserExists(sn)) );
    })
    .subscribe(
      (existsForkResult) => {
        this.deviceExistsList = <DeviceExistsModel[]> existsForkResult;

        this.generateSerialNumbers();
        this.dataLoaded = true;
      },
      error => {
        this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        this.dataLoaded = true;
      });
  }

  accountName(account_id: string): string {
    const account = this.accounts.find((acct: Account) => acct._id === account_id);
    return _.get(account, 'profile.account_name', '');
  }

  facilityName(facility_id: string): string {
    const facility = this.facilities.find(f => f._id === facility_id);
    return _.get(facility, 'profile.name', '');
  }

  facilityDeviceId(facility: SerialNumberFacility, serial_number: string): string {
    const devices = this.devices.filter((device: Device) => device.serial_number === serial_number);
    return devices.map(device => device._id).join(', ');
  }

  residentDeviceId(resident: Resident, serial_number: string): string {
    return resident.serial_numbers
      .map(sn => {
        return this.devices.find(d => d.serial_number === sn)._id;
      }).join(', ');
  }

  filterSerialNumbers() {
    // first filter by errors if active
    const rows = this.errorFilterActive ? this.rows.filter(row => row.errors.length > 0) : this.rows;

    // next filter by search
    if (this.search.length) {
      const searchPhrase = this.search.toLowerCase();
      this.filteredRows = rows.filter((row: SerialNumberRow) =>
        _.get(row, 'serialNumber', '').toLowerCase().includes(searchPhrase)
      );
    } else {
      this.filteredRows = rows;
    }
  }


  // --- load and process data ---

  private getUniqueSerialNumbers() {
    const allSerialNumbers = this.getAllDeviceSerialNumbers();
    const residentSerialNumbers = this.getResidentSerialNumbers();

    return _.uniq( allSerialNumbers.concat( residentSerialNumbers ) );
  }

  private generateSerialNumbers() {
    const serialNumbers = this.getUniqueSerialNumbers();
    serialNumbers.sort((a, b) => a.localeCompare(b) );

    this.rows = serialNumbers.map(serialNumber => this.createSerialNumberRow(serialNumber) );
    this.filterSerialNumbers();
  }

  private getAllDeviceSerialNumbers(): string[] {
    // loop through facilities and residents to find all unique serial numbers
    return this.devices.map(d => d.serial_number);
  }

  private getResidentSerialNumbers(): string[] {
    return Array.from(this.residents.reduce((snSet, resident) => {
      snSet.add(resident.serial_numbers);
      return snSet;
    }, new Set()));
  }

  private createSerialNumberRow(serial_number: string): SerialNumberRow {
    const row = new SerialNumberRow( serial_number );

    row.facilities = this.findSerialNumberFacilities( serial_number );
    row.residents = this.findSerialNumberResidents( serial_number );
    row.errors = this.findRowErrors( row );

    return row;
  }

  private findSerialNumberFacilities(serial_number: string): SerialNumberFacility[] {
    const device = this.devices.find(d => d.serial_number);
    const facility = this.facilities.find(f => device.facility_id === f._id);
    const account = this.accounts.find(a => device.account_id === a._id);

    const row = new SerialNumberFacility();
    row._id = facility._id;
    row.devices = this.devices.filter(d => d.facility_id === facility._id);
    row.name = facility.profile ? facility.profile.name : '';
    row.account = {
      _id: account._id,
      name: account.profile ? account.profile.account_name : ''
    };

    return [row];
  }

  private findSerialNumberResidents(serialNumber: string): Resident[] {
    return this.residents.filter((resident: Resident) => resident.serial_numbers.includes(serialNumber));
  }

  private findRowErrors(row: SerialNumberRow): string[] {
    return this.findFacilityErrors(row)
      .concat( this.findResidentErrors(row) );
  }

  private findFacilityErrors(row: SerialNumberRow): string[] {
    const errors = [];

    if (!row.facilities.length) {
      errors.push('Facility: Serial number not assigned to a facility');
    }

    // multiple facility check, should only be one
    if (row.facilities.length > 1) {
      errors.push('Facility: Assigned to more than facility');
    }

    // check for multiple known _ids
    const knownIds = _.uniq( row.facilities.reduce((ids, facility) => {
      return ids.concat(
        this.devices
          .filter(device => device.serial_number === row.serialNumber)
          .map(device => device._id)
      );
    }, []) );

    if (knownIds.length > 1) {
      errors.push('Facility: Multiple _ids found: ' + knownIds.join(', '));
    }

    // appears multiple times in a facility
    const appearsMutliple = row.facilities.reduce((isDuplicated, facility) => {
      return isDuplicated ? isDuplicated : this.devices
        .filter(device => device.serial_number === row.serialNumber)
        .length > 1;
    }, false);

    if (appearsMutliple) {
      errors.push('Facility: Appears more than once in facility');
    }

    // check to see if device appears in device users list
    if ( !this.deviceUserList.client_devices.includes(row.serialNumber) ) {
      errors.push(`Facility: Device user '${row.serialNumber}' does not exist on account_data bucket`);
    } else {
      // device should exist ... check for proper channel setup
      const deviceExistModel = this.deviceExistsList.find(existModel => existModel.serial_number === row.serialNumber);

      if (!deviceExistModel) {
        errors.push(`Facility: No device user '${row.serialNumber}' exists model. User may be missing from account_data bucket.`);
      } else {
        const account_ids = _.uniq( row.facilities.map(facility => facility.account._id) );

        if ( _.difference(account_ids, deviceExistModel.client.account_ids).length ) {
          const channels = deviceExistModel.client.account_ids.join(', ');
          const acct_ids = account_ids.join(', ');

          errors.push(`Facility: channels [${channels}] do not match accounts [${acct_ids}].`);
        }
      }

    }

    return errors;
  }

  private findResidentErrors(row: SerialNumberRow): string[] {
    const errors = [];

    if (!row.residents.length) {
      errors.push('Resident: No assigned residents');
    }

    // multiple _id check
    const knownIds = _.uniq(row.residents.reduce((ids, resident) => {
      return ids.concat(
        resident.serial_numbers
          .filter(sn => sn === row.serialNumber)
          .map(sn => this.devices.find(d => d.serial_number === sn)._id)
      );
    }, []));

    if (knownIds.length > 1) {
      errors.push('Resident: Multiple _ids found: ' + knownIds.join(', '));
    }

    // duplicated serial numbers
    const duplicated = row.residents.reduce((isDuplicated, resident) => {
      return isDuplicated ? isDuplicated : resident.serial_numbers
        .filter(sn => sn === row.serialNumber)
        .length > 1;
    }, false);

    if (duplicated) {
      errors.push('Resident: Serial number duplicated on residents');
    }

    // residents in multiple accounts
    const accountIds = _.uniq( row.residents.map((resident: Resident) => resident.account_id) );

    if (accountIds.length > 1) {
      errors.push('Resident: Residents from multiple accounts');
    }

    // residents in multiple facilities
    const facilityIds = _.uniq( row.residents.map((resident: Resident) => resident.facility_id) );

    if (facilityIds.length > 1) {
      errors.push('Resident: Residents from multiple facilities');
    }

    // check to see if device appears in device users list
    if ( !this.deviceUserList.resident_devices.includes(row.serialNumber) ) {
      errors.push(`Resident: Device user '${row.serialNumber}' does not exist on resident_data bucket`);
    } else if ( row.residents.length ) { // only if residents are assigned
      // device should exist ... check for proper channel setup
      const deviceExistModel = this.deviceExistsList.find(existModel => existModel.serial_number === row.serialNumber);

      if (!deviceExistModel) {
        errors.push(`Resident: No device user '${row.serialNumber}' exists model. User may be missing from resident_data bucket.`);
      } else {
        const facility_ids = _.uniq( row.facilities.map(facility => facility._id) );

        if ( _.difference(facility_ids, deviceExistModel.resident.facility_ids).length ) {
          const channels = deviceExistModel.resident.facility_ids.join(', ');
          const fac_ids = facility_ids.join(', ');

          errors.push(`Resident: channels [${channels}] do not match accounts [${fac_ids}].`);
        }
      }

    }

    return errors;
  }
}
