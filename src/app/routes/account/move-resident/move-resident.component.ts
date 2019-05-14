import * as _ from 'lodash';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { BaseFormComponent, FormUtil } from '../../../util/FormUtil';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Device } from '../../../model/device/device';
import { DeviceService } from '../../../core/device/device.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { ROLE_MOVE_RESIDENT } from '../../../model/role/role';
import { RoleService, IPermissions } from '../../../core/role/role.service';
import { USER_TYPE_IN2L_ADMIN, USER_TYPE_IN2L } from '../../../model/user/user';

const COMPONENT_NAME = 'move-resident';

@Component({
  selector: 'app-move-resident',
  templateUrl: './move-resident.component.html'
})
export class MoveResidentComponent extends BaseFormComponent implements OnInit {
  accounts: Account[];
  facilities: Facility[];
  accountFacilities: Facility[];
  devices: Device[];
  resident: Resident;

  accountId: string;
  facilityId: string;
  residentId: string;

  form: FormGroup;
  selectedAccount: Account;
  selectedFacility: Facility;
  submitInProgress: boolean;
  residentName: string;

  permissions: IPermissions;

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private facilityService: FacilityService,
    private deviceService: DeviceService,
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private residentService: ResidentService,
    private roleService: RoleService,
    private router: Router,
    private uiEventService: UiEventService
  ) {
    super();
  }

  ngOnInit() {
    this.submitInProgress = false;

    this.permissions = this.roleService.currentUserPermissionsObject([
      { keyName: 'canMoveResident', role: ROLE_MOVE_RESIDENT }
    ]);

    this.form = this.fb.group({
      account_id: [ '', Validators.required ],
      facility_id: [ '', Validators.required ]
    });

    this.activatedRoute.params.subscribe((params: { id: string, facility_id: string, resident_id: string }) => {
      this.accountId = params.id;
      this.facilityId = params.facility_id;
      this.residentId = params.resident_id;

      this.loaderService.start(COMPONENT_NAME);

      Observable.forkJoin(
        this.accountService.getAccounts(),
        this.facilityService.getAllFacilities(),
        this.deviceService.getAllDevices(),
        this.residentService.getResident(this.residentId)
      ).subscribe(([accounts, facilities, devices, resident]: [Account[], Facility[], Device[], Resident]) => {
          this.accounts = accounts.sort((a, b) => a.profile.account_name.toLowerCase().localeCompare(b.profile.account_name.toLowerCase()));
          this.facilities = facilities.sort((a, b) => a.profile.name.toLowerCase().localeCompare(b.profile.name.toLowerCase()));
          this.devices = devices;
          this.resident = resident;

          this.form.patchValue({ account_id: this.accountId });

          this.selectedAccount = this.accounts.find(a => a._id === this.accountId);
          this.accountFacilities = this.facilities.filter(f => f.account_id === this.accountId);
          this.selectedFacility = this.facilities.find(f => f._id === this.facilityId);
          this.form.patchValue({ facility_id: this.facilityId });

          this.residentName = this.resident.first_name + ' ' + this.resident.last_name;
          this.loaderService.stop(COMPONENT_NAME);
        }, error => {
          this.loaderService.stop(COMPONENT_NAME);
        });
    });
  }

  getAccountName(): string {
    return _.get(this, 'selectedAccount.profile.account_name', '');
  }

  canChangeAccount(): boolean {
    return [USER_TYPE_IN2L_ADMIN, USER_TYPE_IN2L].includes(this.authenticationService.currentUser().value.type);
  }

  handleAccountChange() {
    this.selectedAccount = this.accounts.find(a => a._id === this.form.get('account_id').value);
    this.accountFacilities = this.facilities.filter(f => f.account_id === this.form.get('account_id').value);
    this.form.patchValue({ facility_id: '' });
  }

  handleOnSubmit(e, value) {
    if (this.facilityId === this.form.get('facility_id').value) {
      return;
    }

    this.submitInProgress = true;

    e.preventDefault();

    FormUtil.markAllAsTouched(this.form);

    const oldAccount = this.accounts.find(a => a._id === this.accountId);
    const newAccount = this.accounts.find(a => a._id === this.form.get('account_id').value);

    const oldFacility = this.facilities.find(f => f._id === this.facilityId);
    const newFacility = this.facilities.find(f => f._id === this.form.get('facility_id').value);

    this.loaderService.start(COMPONENT_NAME);

    this.residentService.moveResident(this.devices, this.residentId, newAccount._id, newFacility._id)
      .subscribe((movedResident: Resident) => {
          this.uiEventService.dispatch( new ToasterMessage({
            body: `Resident ${this.residentName} has been moved to account ${newAccount.profile.account_name} and facility ${newFacility.profile.name}`,
            type: 'success'
          }));

          this.loaderService.stop(COMPONENT_NAME);

          this.submitInProgress = false;
          this.returnToResidentList(movedResident.account_id, movedResident.facility_id);
        }, (error) => {
          this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
          this.loaderService.stop(COMPONENT_NAME);
          
          // keep button disabled for a bit to prevent duplicate click
          // on fast error responses. This doesn't hurt user experience because
          // their eyes will be drawn to the toaster error message
          setTimeout(() => { this.submitInProgress = false; }, 750);
        });
  }

  submitDisabled(): boolean {
    return this.submitInProgress || !this.form.valid || (this.form.get('account_id').value === this.accountId && this.form.get('facility_id').value === this.facilityId);
  }

  returnToResidentList(newAccountId? : string, newFacilityId?: string) {
    this.router.navigate(['/account', newAccountId || this.accountId,
                'facility', newFacilityId || this.facilityId,
                'resident']);
  }
}
