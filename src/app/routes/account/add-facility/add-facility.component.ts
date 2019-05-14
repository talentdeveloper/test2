import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

import { AccountService } from '../../../core/account/account.service';
import { ADDRESS_COUNTRY_US } from '../../../model/address';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Device } from '../../../model/device/device';
import { DeviceService } from '../../../core/device/device.service';
import { SettingsService } from '../../../core/settings/settings.service';
import { FormUtil } from '../../../util/FormUtil';
import { FacilityAdminUser } from '../../../model/user/facility-admin-user';
import { FacilityFactory } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { FacilityTypes, SubscriptionPackages } from '../../../model/facility/facility-profile';
import { LoaderService } from '../../../core/loader/loader.service';
import { SidebarService } from '../../../layout/sidebar/sidebar.service';
import { InputService } from '../../../core/input/input.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

declare var $: any;

const COMPONENT_NAME = 'add-facility';

@Component({
  selector: 'app-add-facility',
  templateUrl: './add-facility.component.html'
})
export class AddFacilityComponent implements OnInit {
  accountId: string;
  facilityForm: FormGroup;
  profile: FormGroup;
  billing: FormGroup;
  billing_contact: FormGroup;
  status: FormGroup;
  errorMessage: string;
  successMessage: string;
  account: any;
  countries: Array<any>;
  states: Array<any>;
  provinces: Array<any>;
  billingStatus: Array<any>;
  trainingTypes: Array<any>;
  facilityTypeList = FacilityTypes;
  facilityStatuses: Array<any>;
  subscriptionPackageList = SubscriptionPackages;
  selectedCountry = ADDRESS_COUNTRY_US;
  selectedBillingCountry = ADDRESS_COUNTRY_US;
  phoneMask: Array<string | RegExp>;

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private deviceService: DeviceService,
    private facilityService: FacilityService,
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private router: Router,
    public settings: SettingsService,
    private sidebarService: SidebarService,
    private uiEventService: UiEventService
  ) {
    this.phoneMask = InputService.PHONE_MASK;
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: { id: string }) => {
      this.accountId = params.id;
    });

    // trigger last value
    this.activatedRoute.params.last();

    this.accountService.getAccount(this.accountId).subscribe(
      result => {
        this.account = result;

        this.breadcrumbService.updateBreadcrumbs([
          { label: this.account.profile.account_name, url: '/account/' + this.account._id },
          { label: 'Facilities', url: '/account/' + this.account._id + '/facility/list' },
          { label: 'Add Facility', url: '' }
        ]);

        this.profile = this.fb.group({
          name: [null, Validators.required],
          address1: [null, Validators.required],
          address2: [null],
          country: [ADDRESS_COUNTRY_US, Validators.required],
          city: [null, Validators.required],
          state_province: [null, Validators.required],
          zip_postal_code: [null, Validators.required],
          phone: [null, Validators.compose([Validators.required, CustomValidators.phone('US')])],
          technical_contact: [null, Validators.required],
          technical_contact_phone: [
            null,
            Validators.compose([Validators.required, CustomValidators.phone('US')])
          ],
          technical_contact_email: [
            null,
            Validators.compose([Validators.required, CustomValidators.email])
          ],
          facility_types: this.createOptionsMap(this.facilityTypeList, []),
          eden_community_status: [null],
          region: [null, Validators.required],
          number_of_beds: [null, Validators.required],
          training_type: [null, Validators.required],
          subscriptions: this.createOptionsMap(this.subscriptionPackageList, []),
          notes: [null]
        });

        this.billing_contact = this.fb.group({
          first_name: [this.account.billing.contact_first_name, Validators.required],
          last_name: [this.account.billing.contact_last_name, Validators.required],
          address1: [this.account.billing.contact_address1, Validators.required],
          address2: [this.account.billing.contact_address2],
          country: [
            // if not defined, 'Expression has changed after it was checked.' error
            // get thrown on dev enviroments
            this.account.billing.contact_country || ADDRESS_COUNTRY_US,
            Validators.required
          ],
          city: [this.account.billing.contact_city, Validators.required],
          state_province: [this.account.billing.contact_state_province, Validators.required],
          zip_postal_code: [this.account.billing.contact_zip_postal_code, Validators.required],
          phone: [
            this.account.billing.contact_phone,
            Validators.compose([Validators.required, CustomValidators.phone('US')])
          ],
          email: [
            this.account.billing.contact_email,
            Validators.compose([Validators.required, CustomValidators.email])
          ]
        });

        this.billing = this.fb.group({
          status: ['Active', Validators.required],
          tax_exempt_status: [null],
          id: [null, Validators.required],
          contact: this.billing_contact
        });

        this.status = this.fb.group({
          name: [null, Validators.required]
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

    // force setting account_id on add
    value.account_id = this.account._id;

    // update checkbox group values
    value.profile.facility_types = this.getOptionsMapValues(
      this.facilityTypeList,
      value.profile.facility_types
    );
    value.profile.subscriptions = this.getOptionsMapValues(
      this.subscriptionPackageList,
      value.profile.subscriptions
    );

    if (this.facilityForm.valid) {
      this.loaderService.start(COMPONENT_NAME);

      const newFacility = FacilityFactory.create(value);
      this.facilityService.createFacility(newFacility).subscribe(
        () => {
          this.resetForm();
          this.uiEventService.dispatch(
            new ToasterMessage({
              body: 'Facility has been added',
              type: 'success'
            })
          );
          this.reloadAccount();
          this.loaderService.stop(COMPONENT_NAME);
        },
        error => {
          this.errorMessage = error;
          this.loaderService.stop(COMPONENT_NAME);
        }
      );
    }
  }

  resetForm() {
    this.facilityForm.reset();
    this.billing.patchValue({ status: 'Active' });
    this.profile.patchValue({ country: ADDRESS_COUNTRY_US });
    this.billing_contact.patchValue({ country: ADDRESS_COUNTRY_US });
    $('input[type="checkbox"]:checked').click();
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

  clearBillingContactFields(event) {
    if (event.target.checked !== true) {
      this.billing_contact.reset();
      this.billing_contact.patchValue({ country: ADDRESS_COUNTRY_US });
    } else {
      this.billing_contact.patchValue({
        first_name: this.account.billing.contact.first_name,
        last_name: this.account.billing.contact.last_name,
        address1: this.account.billing.contact.address.address1,
        address2: this.account.billing.contact.address.address2,
        country: this.account.billing.contact.address.country,
        city: this.account.billing.contact.address.city,
        state_province: this.account.billing.contact.address.getStateProvince(),
        zip_postal_code: this.account.billing.contact.address.getPostalZip(),
        phone: this.account.billing.contact.phone,
        email: this.account.billing.contact.email
      });
    }
  }

  saveDisabled() {
    return (
      !this.facilityForm.valid ||
      !this.profile.valid ||
      !this.billing.valid ||
      !this.billing_contact.valid ||
      !this.status.valid
    );
  }
}
