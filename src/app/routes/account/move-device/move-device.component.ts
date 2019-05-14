import * as _ from 'lodash';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BaseFormComponent, FormUtil } from '../../../util/FormUtil';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { Device } from '../../../model/device/device';
import { DeviceStatus, DeviceStatusFactory } from '../../../model/device/device-status';
import { DeviceService } from '../../../core/device/device.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'move-device';

@Component({
  selector: 'app-move-device',
  templateUrl: './move-device.component.html'
})
export class MoveDeviceComponent extends BaseFormComponent implements OnInit {
  accounts: Account[];
  facilities: Facility[];
  accountFacilities: Facility[];
  device: Device;
  deviceStatus: DeviceStatus;

  accountId: string;
  facilityId: string;
  deviceId: string;

  dataLoaded: boolean;
  form: FormGroup;
  selectedAccount: Account;
  selectedFacility: Facility;
  submitInProgress: boolean;
  title = 'Device';

  constructor(
    protected accountService: AccountService,
    protected facilityService: FacilityService,
    protected deviceService: DeviceService,
    protected fb: FormBuilder,
    protected route: ActivatedRoute,
    protected router: Router,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {
    super();
  }

  ngOnInit() {
    this.dataLoaded = false;
    this.submitInProgress = false;

    this.form = this.fb.group({
      account_id: ['', Validators.required],
      facility_id: ['', Validators.required]
    });

    this.route.params.subscribe(
      (params: { id: string; facility_id: string; device_id: string }) => {
        this.accountId = params.id;
        this.facilityId = params.facility_id;
        this.deviceId = params.device_id;

        this.loaderService.start(COMPONENT_NAME);

        Observable.forkJoin(
          this.accountService.getAccounts(),
          this.facilityService.getAllFacilities(),
          this.deviceService.getRawDevice(this.deviceId),
          this.deviceService.getDeviceStatusByDeviceId(this.deviceId)
        ).subscribe(
          ([accounts, facilities, device, deviceStatus]: [
            Account[],
            Facility[],
            Device,
            DeviceStatus
          ]) => {
            this.accounts = accounts.sort((a, b) => {
              return a.profile.account_name
                .toLowerCase()
                .localeCompare(b.profile.account_name.toLowerCase());
            });

            this.facilities = facilities.sort((a, b) => {
              return a.profile.name.toLowerCase().localeCompare(b.profile.name.toLowerCase());
            });

            this.device = device;
            this.deviceStatus = deviceStatus || DeviceStatusFactory.createFromDevice(device);

            this.form.patchValue({ account_id: this.accountId });

            this.selectedAccount = this.accounts.find(a => a._id === this.accountId);
            this.accountFacilities = this.facilities.filter(f => f.account_id === this.accountId);
            this.selectedFacility = this.facilities.find(f => f._id === this.facilityId);
            this.form.patchValue({ facility_id: this.facilityId });

            this.title = 'Device : ' + this.device.serial_number + ' : ' + this.device.nickname;
            this.dataLoaded = true;
            this.loaderService.stop(COMPONENT_NAME);
          },
          error => {
            this.dataLoaded = true;
            this.loaderService.stop(COMPONENT_NAME);
          }
        );
      }
    );
  }

  handleAccountChange() {
    this.selectedAccount = this.accounts.find(a => a._id === this.form.get('account_id').value);
    this.accountFacilities = this.facilities.filter(
      f => f.account_id === this.form.get('account_id').value
    );
    this.form.patchValue({ facility_id: '' });
  }

  handleOnSubmit(e) {
    this.submitInProgress = true;

    e.preventDefault();

    FormUtil.markAllAsTouched(this.form);

    const oldAccount = this.accounts.find(a => a._id === this.accountId);
    const newAccount = this.accounts.find(a => a._id === this.form.get('account_id').value);

    const oldFacility = this.facilities.find(f => f._id === this.facilityId);
    const newFacility = this.facilities.find(f => f._id === this.form.get('facility_id').value);

    this.loaderService.start(COMPONENT_NAME);

    this.deviceService
      .moveDevice(
        this.device.serial_number,
        this.device._id,
        this.deviceStatus._id,
        oldFacility.account_id,
        oldFacility._id,
        newFacility.account_id,
        newFacility._id
      )
      .subscribe(
        (movedDevice: Device) => {
          if (
            movedDevice.account_id !== newAccount._id ||
            movedDevice.facility_id !== newFacility._id
          ) {
            throw new Error('Device move failed');
          }

          this.uiEventService.dispatch(
            new ToasterMessage({
              body: `Device ${this.device.serial_number} has been moved to account ${
                newAccount.profile.account_name
              } and facility ${newFacility.profile.name}`,
              type: 'success'
            })
          );

          this.loaderService.stop(COMPONENT_NAME);

          this.submitInProgress = false;
          this.returnToDeviceList(newFacility.account_id, newFacility._id);
        },
        error => {
          this.uiEventService.dispatch(new ToasterMessage({ body: error, type: 'error' }));
          this.loaderService.stop(COMPONENT_NAME);
          // keep button disabled for a bit to prevent duplicate click
          // on fast error responses. This doesn't hurt user experience because
          // their eyes will be drawn to the toaster error message
          setTimeout(() => {
            this.submitInProgress = false;
          }, 750);
        }
      );
  }

  submitDisabled(): boolean {
    return (
      this.submitInProgress ||
      !this.form.valid ||
      (this.form.get('account_id').value === this.accountId &&
        this.form.get('facility_id').value === this.facilityId)
    );
  }

  private returnToDeviceList(newAccountId?: string, newFacilityId?: string) {
    this.router.navigate([
      '/account',
      newAccountId || this.accountId,
      'facility',
      newFacilityId || this.facilityId,
      'devices'
    ]);
  }
}
