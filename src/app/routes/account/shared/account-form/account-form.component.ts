import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators/*, ReactiveFormsModule, FormControl*/ } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';

import { AccountService } from '../../../../core/account/account.service';
import { Account, AccountFactory } from '../../../../model/account/account';
import { ADDRESS_COUNTRY_US } from '../../../../model/address';
import { FormUtil, AppValidator } from '../../../../util/FormUtil';
import { SidebarService } from '../../../../layout/sidebar/sidebar.service';
import { InputService } from '../../../../core/input/input.service';
import { ToasterMessage } from '../../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../../core/loader/loader.service';

const COMPONENT_NAME = 'account-form';

@Component({
  selector: 'app-account-form',
  templateUrl: './account-form.component.html',
  // styleUrls: ['./account-form.component.scss']
  styles: [
    '.datepicker-input { background: transparent; border-bottom: none !important; }'
  ]
})
export class AccountFormComponent implements OnInit {

  @Input() editMode?: boolean;
  @Input() account?: Account;

  accountForm: FormGroup;
  profile: FormGroup;
  billing: FormGroup;
  errorMessage: string;
  successMessage: string;
  corporateNames: Array<any>;
  countries: Array<any>;
  states: Array<any>;
  provinces: Array<any>;
  billingStatus: Array<any>;
  billingFrequency: Array<any>;
  selectedCountry = ADDRESS_COUNTRY_US;
  selectedBillingCountry = ADDRESS_COUNTRY_US;
  phoneMask: Array<string | RegExp>;
  dateMask: Array<string | RegExp>;

  constructor(
    protected accountService: AccountService,
    protected fb: FormBuilder,
    protected router: Router,
    protected sidebarService: SidebarService,
    protected uiEventService: UiEventService,
    protected loaderService : LoaderService
  ) {
    this.phoneMask = InputService.PHONE_MASK;
    this.dateMask = InputService.DATE_MASK;
  }

  ngOnInit() {
    if (typeof(this.editMode) === 'undefined') {
      this.editMode = false;
    }

    if (this.editMode && this.account) {
      if (typeof(this.account.billing.subscription_start_date) === 'object') {
        this.account.billing.subscription_start_date = '';
      }

      if (typeof(this.account.billing.due_date) === 'object') {
        this.account.billing.due_date = '';
      }

      this.selectedCountry = this.account.profile.contact.address.country || ADDRESS_COUNTRY_US;
      this.selectedBillingCountry = this.account.billing.contact.address.country || ADDRESS_COUNTRY_US;
    }

    this.profile = this.fb.group({
      'account_name': [
        this.editMode ? this.account.profile.account_name : null,
        Validators.required
      ],
      'corporate_id': [
        this.editMode ? this.account.profile.corporate_id : null,
        Validators.required
      ],
      'address1': [
        this.editMode ? this.account.profile.contact.address.address1 : null,
        Validators.required
      ],
      'address2': [
        this.editMode ? this.account.profile.contact.address.address2 : null
      ],
      'country': [
        this.editMode ? this.account.profile.contact.address.country : ADDRESS_COUNTRY_US,
        Validators.required
      ],
      'city': [
        this.editMode ? this.account.profile.contact.address.city : null,
        Validators.required
      ],
      'state': [
        this.editMode ? this.account.profile.contact.address.state : null
      ],
      'province': [
        this.editMode ? this.account.profile.contact.address.province : null,
      ],
      'zip_code': [
        this.editMode ? this.account.profile.contact.address.zip_code : null
      ],
      'postal_code': [
        this.editMode ? this.account.profile.contact.address.postal_code : null
      ],
      'phone': [
        this.editMode ? this.account.profile.contact.phone : null,
        Validators.compose([
          Validators.required,
          CustomValidators.phone('US')
        ])
      ],
      'email': [
        this.editMode ? this.account.profile.contact.email : null,
        Validators.compose([Validators.required, CustomValidators.email])
      ],
      'owner': [
        this.editMode ? this.account.profile.owner : null,
        Validators.required
      ],
      'manager': [
        this.editMode ? this.account.profile.manager : null,
        Validators.required
      ],
      'crm_id': [
        this.editMode ? this.account.profile.crm_id : null,
        Validators.required
      ],
      'notes': [
        this.editMode ? this.account.profile.notes : null
      ]
    });

    if (this.editMode && this.account.billing) {
      this.account.billing.tax_exempt_status = this.castToBoolean(this.account.billing.tax_exempt_status);
      this.account.billing.non_profit_status = this.castToBoolean(this.account.billing.non_profit_status);
    }

    this.billing = this.fb.group({
      'id': [
        this.editMode ? this.account.billing.id : null,
        Validators.compose([ Validators.required, Validators.pattern(/^[A-Za-z0-9\-]+$/) ])
      ],
      'status': [
        this.editMode ? this.account.billing.status : 'Active',
        Validators.required
      ],
      'tax_exempt_status': [
        this.editMode ? this.account.billing.tax_exempt_status : null
      ],
      'non_profit_status': [
        this.editMode ? this.account.billing.non_profit_status : null
      ],
      'frequency': [
        this.editMode ? this.account.billing.frequency : null,
        Validators.required
      ],
      'subscription_start_date': [
        this.editMode ? this.account.billing.subscription_start_date : null,
        Validators.compose([
          Validators.required,
          CustomValidators.date,
          AppValidator.dateExists()
        ])
      ],
      'due_date': [
        this.editMode ? this.account.billing.due_date : null,
        Validators.compose([
          Validators.required,
          CustomValidators.date,
          AppValidator.dateExists()
        ])
      ],
      'contact_first_name': [
        this.editMode ? this.account.billing.contact.first_name : null,
        Validators.required
      ],
      'contact_last_name': [
        this.editMode ? this.account.billing.contact.last_name : null,
        Validators.required
      ],
      'contact_address1': [
        this.editMode ? this.account.billing.contact.address.address1 : null,
        Validators.required
      ],
      'contact_address2': [
        this.editMode ? this.account.billing.contact.address.address2 : null
      ],
      'contact_country': [
        this.editMode ? this.account.billing.contact.address.country : ADDRESS_COUNTRY_US,
        Validators.required
      ],
      'contact_city': [
        this.editMode ? this.account.billing.contact.address.city : null,
        Validators.required
      ],
      'contact_state': [
        this.editMode ? this.account.billing.contact.address.state : null
      ],
      'contact_province': [
        this.editMode ? this.account.billing.contact.address.province : null
      ],
      'contact_zip_code': [
        this.editMode ? this.account.billing.contact.address.zip_code : null
      ],
      'contact_postal_code': [
        this.editMode ? this.account.billing.contact.address.postal_code : null
      ],
      'contact_phone': [
        this.editMode ? this.account.billing.contact.phone : null,
        Validators.compose([
          Validators.required,
          CustomValidators.phone('US')
        ])
      ],
      'contact_email': [
        this.editMode ? this.account.billing.contact.email : null,
        Validators.compose([Validators.required, CustomValidators.email])
      ]
    });

    this.accountForm = this.fb.group({
      'profile': this.profile,
      'billing': this.billing
    });

    this.corporateNames = this.accountService.corporateNames();
    this.countries = this.accountService.countryOptions();
    this.states = this.accountService.stateOptions();
    this.provinces = this.accountService.canadianProvinces();
    this.billingStatus = this.accountService.billingStatusOptions();
    this.billingFrequency = this.accountService.billingFrequencyOptions();
  }

  submitForm($event, value) {
    $event.preventDefault();
    this.successMessage = '';
    this.errorMessage = '';

    FormUtil.markAllAsTouched(this.accountForm);

    if (this.accountForm.valid) {
      const accountFactory = new AccountFactory();

      const newAccount = accountFactory.createAccountFromFormValues( value );

      if ( this.editMode ) {
        // merge with previous changes
        const updatedAccount = <Account>Object.assign({}, this.account, newAccount);
        updatedAccount._id = this.account._id;
        updatedAccount._rev = this.account._rev;
        updatedAccount.created_by = this.account.created_by;
        updatedAccount.created_date = this.account.created_date;

        this.updateAccount(updatedAccount._id, updatedAccount);
      } else {
        // trim billing id before using as account id
        newAccount.billing.id = newAccount.billing.id.trim();

        this.addNewAccount(newAccount.billing.id, newAccount);
      }
    }
  }

  private addNewAccount(accountId: string, account: Account) {
    this.loaderService.start(COMPONENT_NAME);

    this.accountService.createAccount(account).subscribe(
      (result) => {
        this.accountForm.reset();
        this.uiEventService.dispatch( new ToasterMessage({
          body: 'Account has been added',
          type: 'success'
        }) );

        this.router.navigate([ '/account', accountId ]);
        this.sidebarService.refresh.next(true);
        this.loaderService.stop(COMPONENT_NAME);
      },
      (error) => {
        this.errorMessage = error;
        this.loaderService.stop(COMPONENT_NAME);
      }
    );
  }

  private updateAccount(accountId, account: Account) {
    this.loaderService.start(COMPONENT_NAME);

    this.accountService.updateAccount(account).subscribe(
      (result) => {
        this.accountForm.reset();

        this.uiEventService.dispatch( new ToasterMessage({
          body: 'Account has been updated',
          type: 'success'
        }) );

        this.router.navigate([ '/account', accountId ]);
        this.sidebarService.refresh.next(true);
        this.loaderService.stop(COMPONENT_NAME);
      },
      (error) => {
        this.errorMessage = error;
        this.loaderService.stop(COMPONENT_NAME);
      }
    );
  }

  populateBillingAddress(ev) {
    if (ev.target.checked === true) {
      this.selectedBillingCountry = this.profile.get('country').value;
      this.billing.patchValue({
        'contact_address1': this.profile.get('address1').value,
        'contact_address2': this.profile.get('address2').value,
        'contact_country': this.profile.get('country').value,
        'contact_city': this.profile.get('city').value,
        'contact_state': this.profile.get('state').value,
        'contact_province': this.profile.get('province').value,
        'contact_zip_code': this.profile.get('zip_code').value,
        'contact_postal_code': this.profile.get('postal_code').value,
        'contact_phone': this.profile.get('phone').value,
        'contact_email': this.profile.get('email').value
      });
    } else {
      this.billing.patchValue({
        'contact_address1': '',
        'contact_address2': '',
        'contact_country': ADDRESS_COUNTRY_US,
        'contact_city': '',
        'contact_state': '',
        'contact_province': '',
        'contact_zip_code': '',
        'contact_postal_code': '',
        'contact_phone': '',
        'contact_email': ''
      });
      this.selectedBillingCountry = ADDRESS_COUNTRY_US;
    }
  }

  cancel() {
    const route = this.editMode ? ['/account', this.account._id ] : ['/home'];
    this.router.navigate(route);
  }

  castToBoolean(value) {
    if (typeof value === 'string') {
      return value === 'true';
    }

    return value;
  }

  saveDisabled(): boolean {
    return !this.accountForm.valid || !this.profile.valid || !this.billing.valid;
  }
}
