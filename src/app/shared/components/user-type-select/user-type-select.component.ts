import * as _ from 'lodash';

import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { CustomValidators } from 'ng2-validation';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { InputService } from '../../../core/input/input.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { UserFactoryService } from '../../../core/user/user-factory.service';
import { IUser } from '../../../model/user/user';
import {
  UserTypes,
  USER_TYPE_IN2L_ADMIN,
  USER_TYPE_IN2L,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_FACILITY_USER,
  USER_RESIDENT_MODE_ALL,
  USER_RESIDENT_MODE_SELECT
} from '../../../model/user/user';

@Component({
  selector: 'app-user-type-select',
  templateUrl: './user-type-select.component.html'
})
export class UserTypeSelectComponent implements OnInit {
  @Input()
  parentForm: FormGroup;
  @Input()
  existingUser: any;

  phoneMask = InputService.PHONE_MASK;

  defaults = {
    accountId: '',
    accountName: '',
    accountType: '',
    email: '',
    facilityIds: null,
    facilityName: '',
    firstName: '',
    lastName: '',
    pin: '',
    phone: '',
    residentIds: [],
    residentMode: USER_RESIDENT_MODE_ALL,
    title: ''
  };

  facilityUserAllowed: boolean;

  accountTypes: Array<{ name: string; type: string }> = [];
  accountTypeNames: Array<{ id: string; text: string }> = [];

  accounts: Account[] = []; // full account docs, needed for facility data
  accountNames: Array<{ id: string; text: string }> = []; // key value of account ids and account name

  facilities: Facility[];
  facilityNames: Array<{ id: string; text: string }> = [];

  residentNames: Array<{ id: string; text: string }>;

  selectedAccountType: string;
  selectedAccountId: string;
  selectedFacilities: Array<{ id: string; text: string }> = [];
  selectedResidentMode: string = USER_RESIDENT_MODE_ALL;
  selectedResidents: Array<{ id: string; text: string }> = [];

  currentUser: IUser;

  randomPin: string = _.padStart(_.random(99999).toString(), 5, '0');

  viewReady = false;

  userTypeValues = {
    [USER_TYPE_IN2L_ADMIN]: 5,
    [USER_TYPE_IN2L]: 4,
    [USER_TYPE_ACCOUNT_ADMIN]: 3,
    [USER_TYPE_FACILITY_ADMIN]: 2,
    [USER_TYPE_FACILITY_USER]: 1
  };

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private facilityService: FacilityService,
    private residentService: ResidentService,
    private userFactoryService: UserFactoryService
  ) {}

  ngOnInit() {
    this.currentUser = this.authenticationService.currentUser().value;

    this.activatedRoute.params.subscribe(
      (params: { id?: string; facility_id?: string }) => {
        this.facilityUserAllowed = !!params.id && !!params.facility_id;

        if (this.existingUser) {
          this.defaults.accountType = this.existingUser.type || '';
          this.defaults.accountId = this.existingUser.account_id || '';
          this.defaults.email = this.existingUser.email || '';
          this.defaults.facilityIds = this.existingUser.facility_ids || null;
          this.defaults.firstName = this.existingUser.first_name || '';
          this.defaults.lastName = this.existingUser.last_name || '';
          this.defaults.phone = this.existingUser.phone || '';
          this.defaults.pin = this.existingUser.pin || '';
          this.defaults.residentIds = this.existingUser.resident_ids || [];
          this.defaults.residentMode =
            this.existingUser.resident_mode || USER_RESIDENT_MODE_SELECT;
          this.defaults.title = this.existingUser.title || '';
        }

        this.defaults.accountId = this.defaults.accountId || params.id || '';
        this.defaults.facilityIds =
          this.defaults.facilityIds ||
          (params.facility_id ? [params.facility_id] : []);

        Observable.forkJoin(
          this.accountService.getAccounts(),
          this.facilityService.getAllFacilities(),
          this.facilityUserAllowed
            ? this.residentService.getAllResidentsForFacility(
                params.facility_id
              )
            : Observable.of([])
        ).subscribe(
          ([accounts, facilities, residents]: [
            Account[],
            Facility[],
            Resident[]
          ]) => {
            // User Role Type: Set the account types that the logged in user can select
            this.accountTypes = UserTypes.filter(value => {
              // Only show facility user if this is an account/facility staff invite page
              // Only show the user types that have equal or less rights than the current users type
              return value.type === USER_TYPE_FACILITY_USER &&
                !this.facilityUserAllowed
                ? false
                : this.userTypeValues[this.currentUser.type] >=
                    this.userTypeValues[value.type];
            });

            this.setAccountTypeDropdownValues();

            // Accounts: Set the accounts that the logged in user can select (should only be one unless it is a IN2L Admin)
            this.accounts =
              this.currentUser.type === USER_TYPE_IN2L_ADMIN
                ? accounts
                : accounts.filter(a => a._id === this.currentUser.account_id);

            this.setAccountDropdownValues();

            // Facilities: Set the list of facilities based on what the logged in user has access to
            this.facilities = this.isFacilityAdmin(this.currentUser.type)
              ? facilities.filter(f =>
                  this.currentUser.facility_ids.includes(f._id)
                )
              : facilities;

            this.setFacilityDropdownValues();

            this.residentNames = residents.map(r => ({
              id: r._id,
              text: `${r.first_name} ${r.last_name}`
            }));

            this.initForm();
          }
        );
      }
    );
  }

  setAccountTypeDropdownValues() {
    this.accountTypeNames = this.accountTypes.map(value => ({
      id: value.type,
      text: value.name
    }));
    this.selectedAccountType =
      this.selectedAccountType || this.defaults.accountType || null;
  }

  setAccountDropdownValues() {
    this.accountNames = this.accounts.map(a => ({
      id: a._id,
      text: a.profile.account_name
    }));

    this.selectedAccountId =
      this.selectedAccountId || this.defaults.accountId || null;
  }

  setFacilityDropdownValues() {
    this.facilityNames = this.facilities
      .filter(f => f.account_id === this.selectedAccountId)
      .map(f => ({ id: f._id, text: f.profile.name }));
    this.facilityNames.sort((a, b) => a.text.localeCompare(b.text));

    if (this.facilityNames.length === 1) {
      this.selectedFacilities = this.facilityNames;
    } else if (this.selectedFacilities.length === 0) {
      this.selectedFacilities = this.facilityNames.filter(f =>
        this.defaults.facilityIds.includes(f.id)
      );
    } else {
      this.selectedFacilities = this.selectedFacilities.filter(f =>
        this.facilityNames.map(n => n.id).includes(f.id)
      );
    }

    if (this.parentForm && this.parentForm.get('facilityIds')) {
      this.parentForm
        .get('facilityIds')
        .setValue(this.selectedFacilities.map(f => f.id));
    }
  }

  // observable watching account type value changes
  onAccountTypeChange(selectedAccountType: string) {
    this.selectedAccountType = selectedAccountType;
    this.parentForm.get('accountType').setValue(this.selectedAccountType);

    if (!this.selectedAccountType) {
      return;
    }

    this.parentForm.get('email').validator = this.isFacilityUser(
      this.selectedAccountType
    )
      ? CustomValidators.email
      : Validators.compose([Validators.required, CustomValidators.email]);
    this.parentForm.get('email').updateValueAndValidity();

    this.parentForm.get('accountId').validator = this.isIn2lType(
      this.selectedAccountType
    )
      ? Validators.nullValidator
      : Validators.required;
    this.parentForm.get('accountId').updateValueAndValidity();

    this.parentForm.get('facilityIds').validator =
      this.isFacilityAdmin(this.selectedAccountType) ||
      this.isFacilityUser(this.selectedAccountType)
        ? Validators.compose([Validators.required, Validators.minLength(1)])
        : Validators.nullValidator;
    this.parentForm.get('facilityIds').updateValueAndValidity();

    this.parentForm.get('firstName').validator = this.isFacilityUser(
      this.selectedAccountType
    )
      ? Validators.required
      : Validators.nullValidator;

    this.parentForm.get('lastName').validator = this.isFacilityUser(
      this.selectedAccountType
    )
      ? Validators.required
      : Validators.nullValidator;

    // Account admin and below require an account selection so default it to the default account
    if (
      this.userTypeValues[this.selectedAccountType] <=
      this.userTypeValues[USER_TYPE_ACCOUNT_ADMIN]
    ) {
      this.setAccountDropdownValues();
    }

    // Facility admin and below require a facility selection so default it to the default facilities
    if (this.isFacilityAdmin(this.selectedAccountType)) {
      this.setFacilityDropdownValues();
    }

    if (this.isFacilityUser(selectedAccountType)) {
      this.parentForm.get('accountId').setValue(this.defaults.accountId);
      this.parentForm.get('facilityIds').setValue(this.defaults.facilityIds);
      this.parentForm.get('firstName').setValue(this.defaults.firstName);
      this.parentForm.get('lastName').setValue(this.defaults.lastName);
      this.parentForm.get('phone').setValue(this.defaults.phone);
      this.parentForm.get('phone').validator = Validators.pattern(
        InputService.PHONE_VALIDATION_PATTERN
      );
      this.parentForm.get('pin').setValue(this.randomPin);
      this.parentForm.get('residentMode').setValue(this.defaults.residentMode);
      this.parentForm
        .get('residentIds')
        .setValue(
          this.residentNames.filter(item =>
            this.defaults.residentIds.includes(item.id)
          )
        );
      this.parentForm.get('title').setValue(this.defaults.title);
    }
  }

  // observable watching account value changes
  onAccountChange(selectedAccountId) {
    this.selectedAccountId = selectedAccountId;

    this.setFacilityDropdownValues();
  }

  showEmail(): boolean {
    return !this.existingUser && !!this.selectedAccountType;
  }

  accountName(): string {
    return _.get(
      this.accounts.find(a => a._id === this.defaults.accountId),
      'profile.account_name',
      ''
    );
  }

  facilityName(): string {
    const facilityId = this.defaults.facilityIds[0];
    return _.get(
      this.facilities.find(f => f._id === facilityId),
      'profile.name',
      ''
    );
  }

  isAccountAdmin(type: string): boolean {
    return type === USER_TYPE_ACCOUNT_ADMIN;
  }

  isFacilityAdmin(type: string): boolean {
    return type === USER_TYPE_FACILITY_ADMIN;
  }

  isFacilityUser(type: string): boolean {
    return type === USER_TYPE_FACILITY_USER;
  }

  isIn2lType(type: string): boolean {
    return type === USER_TYPE_IN2L_ADMIN || type === USER_TYPE_IN2L;
  }

  showAccountDropdown() {
    return (
      this.selectedAccountType &&
      (this.isAccountAdmin(this.selectedAccountType) ||
        this.isFacilityAdmin(this.selectedAccountType))
    );
  }

  showFacilityDropdown() {
    return (
      this.selectedAccountType &&
      this.selectedAccountId &&
      this.isFacilityAdmin(this.selectedAccountType)
    );
  }

  showFacilityUserForm() {
    return !this.existingUser && this.isFacilityUser(this.selectedAccountType);
  }

  showResidentSelector() {
    return (
      this.showFacilityUserForm() &&
      this.selectedResidentMode === USER_RESIDENT_MODE_SELECT
    );
  }

  handleAddFacility(selected) {
    this.selectedFacilities = this.selectedFacilities
      .filter(f => f.id !== selected.id)
      .concat(selected);
    this.parentForm
      .get('facilityIds')
      .setValue(this.selectedFacilities.map(f => f.id));
  }

  handleRemoveFacility(selected) {
    this.selectedFacilities = this.selectedFacilities.filter(
      f => f.id !== selected.id
    );
    this.parentForm
      .get('facilityIds')
      .setValue(this.selectedFacilities.map(f => f.id));
  }

  setResidentModeAll() {
    this.parentForm.get('resident_mode').setValue(USER_RESIDENT_MODE_ALL);
  }

  setResidentModeSelect() {
    this.parentForm.get('resident_mode').setValue(USER_RESIDENT_MODE_SELECT);
  }

  handleAddResident(selected) {
    this.selectedResidents = this.selectedResidents
      .filter(f => f.id !== selected.id)
      .concat(selected);
    this.parentForm
      .get('residentIds')
      .setValue(this.selectedResidents.map(f => f.id));
  }

  handleRemoveResident(selected) {
    this.selectedResidents = this.selectedResidents.filter(
      f => f.id !== selected.id
    );
    this.parentForm
      .get('residentIds')
      .setValue(this.selectedResidents.map(f => f.id));
  }

  private initForm() {
    this.parentForm.addControl('email', new FormControl(this.defaults.email));
    this.parentForm.get('email').validator =
      !this.existingUser && this.facilityUserAllowed
        ? CustomValidators.email
        : Validators.compose([Validators.required, CustomValidators.email]);

    this.parentForm.addControl(
      'accountType',
      new FormControl(this.defaults.accountType, Validators.required)
    );
    this.parentForm.addControl(
      'accountId',
      new FormControl(this.defaults.accountId)
    );
    this.parentForm.addControl(
      'facilityIds',
      new FormControl(this.defaults.facilityIds)
    );
    this.parentForm.addControl(
      'firstName',
      new FormControl(this.defaults.firstName)
    );
    this.parentForm.addControl(
      'lastName',
      new FormControl(this.defaults.lastName)
    );
    this.parentForm.addControl('pin', new FormControl(this.defaults.pin));
    this.parentForm.addControl('title', new FormControl(this.defaults.title));
    this.parentForm.addControl('phone', new FormControl(this.defaults.phone));
    this.parentForm.addControl(
      'residentMode',
      new FormControl(this.defaults.residentMode)
    );
    this.parentForm.addControl(
      'residentIds',
      new FormControl(this.defaults.residentIds)
    );

    this.viewReady = true;
  }
}
