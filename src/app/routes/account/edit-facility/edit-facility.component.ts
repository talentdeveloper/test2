import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Response } from '@angular/http';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
  FormArray
} from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import 'rxjs/add/operator/map';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { FormUtil } from '../../../util/FormUtil';
import { Facility, FacilityFactory } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { FacilityTypes, SubscriptionPackages } from '../../../model/facility/facility-profile';
import { FacilityAdminUser } from '../../../model/user/facility-admin-user';
import { SidebarService } from '../../../layout/sidebar/sidebar.service';
import { InputService } from '../../../core/input/input.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';
import { IUser, USER_TYPE_FACILITY_ADMIN } from '../../../model/user/user';
import { UserService } from '../../../core/user/user.service';

declare var $: any;

const COMPONENT_NAME = 'edit-facility';

@Component({
  selector: 'app-edit-facility',
  templateUrl: './edit-facility.component.html'
})
export class EditFacilityComponent implements OnInit {
  accountId: string;
  account: any;
  facilityId: string;
  facility: any;
  facilityForm: FormGroup;
  facilityTypeList = FacilityTypes;
  facilityStatuses: Array<any>;

  atLeastOnePinSet: boolean;

  profile: FormGroup;
  billing: FormGroup;
  billingStatus: Array<any>;
  billing_contact: FormGroup;
  status: FormGroup;
  errorMessage: string;
  successMessage: string;
  countries: Array<any>;
  states: Array<any>;
  provinces: Array<any>;
  trainingTypes: Array<any>;
  subscriptionPackageList = SubscriptionPackages;
  selectedCountry: string;
  selectedBillingCountry: string;
  phoneMask: Array<string | RegExp>;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private breadcrumbService: BreadcrumbService,
    private facilityService: FacilityService,
    private route: ActivatedRoute,
    private router: Router,
    private sidebarService: SidebarService,
    private uiEventService: UiEventService,
    private loaderService: LoaderService,
    private userService: UserService
  ) {
    this.phoneMask = InputService.PHONE_MASK;
  }

  ngOnInit() {
    this.accountId = this.route.snapshot.params['id'];
    this.facilityId = this.route.snapshot.params['facility_id'];

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getFacility(this.facilityId),
      this.userService.getUsersForFacility(this.accountId, this.facilityId)
    ).subscribe(
      ([account, facility, staff]: [Account, Facility, IUser[]]) => {
        this.account = account;
        this.facility = facility;
        this.atLeastOnePinSet = staff.some(
          user => user.type === USER_TYPE_FACILITY_ADMIN && !!user.pin
        );

        this.breadcrumbService.updateBreadcrumbs([
          { label: this.account.profile.account_name, url: '/account/' + this.account._id },
          { label: 'Facilities', url: '/account/' + this.account._id + '/facility/list' },
          {
            label: `${this.facility.profile.name}`,
            url: '/account/' + this.account._id + '/facility/' + this.facility._id
          },
          { label: `Edit ${this.facility.profile.name}`, url: '' }
        ]);

        this.selectedCountry = this.facility.profile.country;
        this.selectedBillingCountry = this.facility.billing.contact.country;

        this.profile = this.fb.group({
          name: [this.facility.profile.name, Validators.required],
          address1: [this.facility.profile.address1, Validators.required],
          address2: [this.facility.profile.address2],
          country: [this.facility.profile.country, Validators.required],
          city: [this.facility.profile.city, Validators.required],
          state_province: [this.facility.profile.state_province, Validators.required],
          zip_postal_code: [this.facility.profile.zip_postal_code, Validators.required],
          phone: [
            this.facility.profile.phone,
            Validators.compose([Validators.required, CustomValidators.phone('US')])
          ],
          technical_contact: [this.facility.profile.technical_contact, Validators.required],
          technical_contact_phone: [
            this.facility.profile.technical_contact_phone,
            Validators.compose([Validators.required, CustomValidators.phone('US')])
          ],
          technical_contact_email: [
            this.facility.profile.technical_contact_email,
            Validators.compose([Validators.required, CustomValidators.email])
          ],
          facility_types: this.createOptionsMap(
            this.facilityTypeList,
            _.get(this.facility, 'profile.facility_types', [])
          ),
          eden_community_status: [this.facility.profile.eden_community_status],
          region: [this.facility.profile.region, Validators.required],
          number_of_beds: [this.facility.profile.number_of_beds, Validators.required],
          training_type: [this.facility.profile.training_type, Validators.required],
          subscriptions: this.createOptionsMap(
            this.subscriptionPackageList,
            _.get(this.facility, 'profile.subscriptions', [])
          ),
          require_staff_login: [this.facility.profile.require_staff_login],
          notes: [this.facility.profile.notes]
        });

        this.billing_contact = this.fb.group({
          first_name: [this.facility.billing.contact.first_name, Validators.required],
          last_name: [this.facility.billing.contact.last_name, Validators.required],
          address1: [this.facility.billing.contact.address1, Validators.required],
          address2: [this.facility.billing.contact.address2],
          country: [this.facility.billing.contact.country, Validators.required],
          city: [this.facility.billing.contact.city, Validators.required],
          state_province: [this.facility.billing.contact.state_province, Validators.required],
          zip_postal_code: [this.facility.billing.contact.zip_postal_code, Validators.required],
          phone: [
            this.facility.billing.contact.phone,
            Validators.compose([Validators.required, CustomValidators.phone('US')])
          ],
          email: [
            this.facility.billing.contact.email,
            Validators.compose([Validators.required, CustomValidators.email])
          ]
        });

        this.billing = this.fb.group({
          status: ['Active', Validators.required],
          tax_exempt_status: [this.facility.billing.tax_exempt_status],
          id: [this.facility.billing.id, Validators.required],
          contact: this.billing_contact
        });

        // For any facilities that have been created already without a status
        // initialize the status object on selected facility
        if (this.facility.status === undefined) {
          this.facility.status = {};
        }

        this.status = this.fb.group({
          name: [this.facility.status.name, Validators.required]
        });

        this.facilityForm = this.fb.group({
          profile: this.profile,
          billing: this.billing,
          status: this.status
        });

        this.countries = this.accountService.countryOptions();
        this.states = this.accountService.stateOptions();
        this.provinces = this.accountService.canadianProvinces();
        this.billingStatus = this.accountService.billingStatusOptions();
        this.facilityStatuses = this.accountService.facilityStatuses();

        this.trainingTypes = [{ name: 'Onsite' }, { name: 'Web' }];
      },
      error => {
        this.uiEventService.dispatch(new ToasterMessage({ body: error, type: 'error' }));
      }
    );
  }

  submitForm($ev, value) {
    $ev.preventDefault();
    this.successMessage = '';
    this.errorMessage = '';

    FormUtil.markAllAsTouched(this.facilityForm);

    // facility_types is an array of true/false values, re-map to actual values
    value.profile.facility_types = this.getOptionsMapValues(
      this.facilityTypeList,
      value.profile.facility_types
    );
    value.profile.subscriptions = this.getOptionsMapValues(
      this.subscriptionPackageList,
      value.profile.subscriptions
    );

    // need to add facility._id to form value object so FaciltyFactory.create below does not assign a new UUID
    // if a new UUID gets assigned, the facility object will not update
    value._id = this.facility._id;

    // make sure facilities account_id is still set
    value.account_id = this.account._id;

    if (this.facilityForm.valid) {
      this.loaderService.start(COMPONENT_NAME);

      // merge with previous changes
      const updatedFacility = <Facility>(
        Object.assign({}, this.facility, FacilityFactory.create(value))
      );
      updatedFacility._id = this.facility._id;
      updatedFacility._rev = this.facility._rev;
      updatedFacility.created_by = this.facility.created_by;
      updatedFacility.created_date = this.facility.created_date;

      this.facilityService.updateFacility(updatedFacility).subscribe(
        result => {
          this.uiEventService.dispatch(
            new ToasterMessage({
              body: 'Facility has been updated',
              type: 'success'
            })
          );
          this.loaderService.stop(COMPONENT_NAME);
          this.router.navigate(['/account', this.accountId, 'facility', this.facilityId]);
        },
        error => {
          this.loaderService.stop(COMPONENT_NAME);
          this.errorMessage = error;
        }
      );
    }
  }

  createOptionsMap(options: Array<{ name: string; type: string }>, values: string[]): FormArray {
    return new FormArray(
      options.map(item => {
        return new FormControl(values.some(value => value === item.name));
      })
    );
  }

  getOptionsMapValues(options: Array<{ name: string; type: string }>, data: boolean[]) {
    if (options.length !== data.length) {
      throw new Error('Invalid form control map');
    }

    return data
      .map((value: boolean, index: number) => (value ? options[index].name : ''))
      .filter(value => value); // filter out empty values
  }

  reloadAccount() {
    this.sidebarService.refresh.next(true);
    this.accountService.getAccount(this.account._id).subscribe(
      result => {
        this.account = result;
      },
      error => {
        this.uiEventService.dispatch(new ToasterMessage({ body: error, type: 'error' }));
      }
    );
  }

  onTechnicalUserSelection(user: FacilityAdminUser) {
    if (user) {
      this.profile.patchValue({
        technical_contact: `${user.first_name} ${user.last_name}`,
        technical_contact_phone: user.phone,
        technical_contact_email: user.email
      });
    }
  }

  formIsValid() {
    const facilityValid = this.facilityForm.valid;
    const profileValid = this.profile.valid;
    const billingValid = this.billing.valid;
    const billingContactValid = this.billing_contact.valid;
    const statusValid = this.status.valid;
    return (
      this.facilityForm.valid &&
      this.profile.valid &&
      this.billing.valid &&
      this.billing_contact.valid &&
      this.status.valid
    );
  }

  verifyStaffPins() {
    if (this.atLeastOnePinSet) {
      return;
    }

    this.profile.get('require_staff_login').setValue(false);
    this.uiEventService.dispatch(
      new ToasterMessage({
        body:
          'At least one facility staff user must have a PIN set before requiring "Staff Unlock".',
        type: 'warning'
      })
    );
  }
}
