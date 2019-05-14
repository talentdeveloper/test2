import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { Device } from '../../../model/device/device';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


interface IValidationCheck {
  valid: boolean;
  level?: string;
  problem?: string;
}


@Component({
  selector: 'app-admin-resident-device-list',
  templateUrl: './admin-resident-device-list.component.html',
  styles: [
    '.resident-cell { width: 200px } ',
    '.text-align-top { vertical-align: top !important }'
  ]
})
export class AdminResidentDeviceListComponent implements OnInit {

  dataLoaded = false;
  residents: Resident[] = [];
  accounts: Account[] = [];
  facilities: Facility[] = [];
  devices: Device[] = [];

  constructor(
    private accountService: AccountService,
    private deviceService: DeviceService,
    private facilityService: FacilityService,
    private residentService: ResidentService,
    private router: Router,
    private uiEventService: UiEventService
  ) { }

  ngOnInit() {
    // load all accounts and residents
    this.accountService.getAccounts()
      .flatMap((accounts) => {
        this.accounts = accounts;

        return this.facilityService.getAllFacilities();
      })
      .flatMap((facilities: Facility[]) => {
        this.facilities = facilities;

        return this.deviceService.getAllDevices();
      })
      .flatMap((devices: Device[]) => {
        this.devices = devices;

        return this.residentService.getAllResidents();
      })
      .subscribe(
        (residents: Resident[]) => {
          this.residents = residents;
          this.dataLoaded = true;
        },
        error => {
          this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
          this.dataLoaded = true;
        }
      );
  }

  accountForResident(resident: Resident): string {
    const account = this.getResidentAccount(resident);

    return account && account.profile ? account.profile.account_name : '';
  }

  facilityForResident(resident: Resident): string {
    const facility = this.getResidentFacility(resident);

    return facility && facility.profile ? facility.profile.name : '';
  }

  facilityCheck(resident: Resident, serialNumber: string): string {
    const check = this.runFacilityDevicesCheck(resident, serialNumber);

    if (check.valid) {
      return '<label class="label label-success">Pass</label>';
    }

    return `<label class="label label-${check.level}">Problem</label><p class="mt text-${check.level}">${check.problem}</p>`;
  }

  facilityCheckPassed(resident: Resident, serialNumber: string): boolean {
    return this.runFacilityDevicesCheck(resident, serialNumber).valid;
  }

  residentCheck(resident: Resident, serialNumber: string): string {
    const check = this.runResidentDevicesCheck(resident, serialNumber);

    if (check.valid) {
      return '<label class="label label-success">Pass</label>';
    }

    return `<label class="label label-${check.level}">Problem</label><p class="mt text-${check.level}">${check.problem}</p>`;
  }

  residentCheckPassed(resident: Resident, serialNumber: string): boolean {
    return this.runResidentDevicesCheck(resident, serialNumber).valid;
  }

  getDeviceId(serialNumber: string): string {
    return this.devices.find(d => d.serial_number === serialNumber)._id;
  }

  private getResidentAccount(resident: Resident): Account | null {
    const residentAccount = this.accounts.find((account: Account) => account._id === resident.account_id);

    return residentAccount ? residentAccount : null;
  }

  private getResidentFacility(resident: Resident): Facility | null {
    const residentFacility = this.facilities.find((facility: Facility) => facility._id === resident.facility_id);

    return residentFacility ? residentFacility : null;
  }

  private getFacilityDevices(facilityId: string): Device[] {
    return this.devices.filter(d => d.facility_id === facilityId);
  }

  private runFacilityDevicesCheck(resident: Resident, serialNumber: string): IValidationCheck {
    const facility = this.getResidentFacility(resident);

    if (!facility) {
      return { valid: false, level: 'danger', problem: 'Residents facility not found' };
    }

    const facilityDevices = this.getFacilityDevices(facility._id);

    if (!facilityDevices.length) {
      return { valid: false, level: 'danger', problem: 'Facility missing devices list' };
    }

    if (!facilityDevices || !facilityDevices.length) {
      return { valid: false, level: 'danger', problem: 'Device ID not found' };
    }

    if (facilityDevices.length > 1) {
      return { valid: false, level: 'warning', problem: 'Device ID found 2+ times' };
    }

    if (facilityDevices.length === 1) {
      // check for serial number
      const snDevices = this.devices.filter((snDevice) => serialNumber === snDevice.serial_number);

      if (!snDevices || !snDevices.length) {
        return { valid: false, level: 'danger', problem: 'Serial number not found' };
      }

      if (snDevices.length > 1) {
        return { valid: false, level: 'danger', problem: 'Serial number found 2+ times' };
      }

      if (snDevices.length === 1) {
        return { valid: true };
      }
    }

    return { valid: false, level: 'danger', problem: 'Unkown problem' };
  }

  private runResidentDevicesCheck(resident: Resident, serialNumber: string): IValidationCheck {
    // check for duplicate devices by _id
    const devicesWithId = resident.serial_numbers
      .filter(sn => this.devices.find(d => d.serial_number === sn)._id);

    if (!devicesWithId || !devicesWithId.length) {
      return { valid: false, level: 'danger', problem: 'Device id missing' };
    }

    if (devicesWithId.length > 1) {
      return { valid: false, level: 'danger', problem: 'Device id found 2+ times' };
    }

    // check for duplicate devices by serial number
    const devicesWithSerialNumber = resident.serial_numbers;

    if (!devicesWithSerialNumber || !devicesWithSerialNumber.length) {
      return { valid: false, level: 'danger', problem: 'Device serial number missing' };
    }

    if (devicesWithSerialNumber.length > 1) {
      return { valid: false, level: 'danger', problem: 'Device serial number found 2+ times' };
    }


    if (devicesWithId.length === 1 && devicesWithSerialNumber.length === 1) {
      return { valid: true };
    }

    return { valid: false, level: 'danger', problem: 'Unkown problem' };
  }
}
