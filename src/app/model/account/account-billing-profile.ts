import * as moment from 'moment';

import { Address, ADDRESS_COUNTRY_CANADA } from '../address';
import { Contact } from '../contact';

export const BILLING_STATUS_ACTIVE = 'active';
export const BILLING_STATUS_INACTIVE = 'inactive';

export const BILLING_FREQUENCY_MONTHLY = 'monthly';
export const BILLING_FREQUENCY_QUARTERLY = 'quarterly';
export const BILLING_FREQUENCY_SEMI_ANNUALLY = 'semi_annually';
export const BILLING_FREQUENCY_ANNUALLY = 'annually';
export const BILLING_FREQUENCY_BI_ANNUALLY = 'bi_annually';

export const BillingFrequencies = [
  { name: 'Monthly', type: BILLING_FREQUENCY_MONTHLY },
  { name: 'Quarterly', type: BILLING_FREQUENCY_QUARTERLY },
  { name: 'Semi-Annually', type: BILLING_FREQUENCY_SEMI_ANNUALLY },
  { name: 'Annually', type: BILLING_FREQUENCY_ANNUALLY },
  { name: 'Bi-Annually', type: BILLING_FREQUENCY_BI_ANNUALLY }
];

// --- define account billing profile model ---

export class AccountBillingProfile {
  id: string;
  contact: Contact;
  due_date: string;
  frequency: string;
  non_profit_status: boolean;
  status: string;
  subscription_start_date: string;
  tax_exempt_status: boolean;

  constructor(
    id: string = '',
    contact: Contact = new Contact(),
    due_date: string = '',
    frequency: string = '',
    non_profit: boolean = false,
    status: string = BILLING_STATUS_ACTIVE,
    subscription_start_date: string = '',
    tax_exempt: boolean = false
  ) {
    this.id = id;
    this.contact = contact;
    this.due_date = due_date;
    this.frequency = frequency;
    this.non_profit_status = non_profit;
    this.status = status;
    this.subscription_start_date = subscription_start_date;
    this.tax_exempt_status = tax_exempt;
  }
}

// --- create an empty base account billing profile --

export const EmptyAccountBillingProfile = new AccountBillingProfile();

// --- create an account billing profile factory for building a new billing profile --

export class AccountBillingProfileFactory {
  createAccountBillingProfileFromFormValues(values): AccountBillingProfile {
    const billingProfile = new AccountBillingProfile();
    billingProfile.contact = new Contact();
    billingProfile.contact.address = new Address();

    if (!values) {
      return billingProfile;
    }

    // root level profile properties

    if (values.id) {
      billingProfile.id = values.id.trim();
    }

    if (values.due_date) {
      const dueDate = moment(values.due_date);
      billingProfile.due_date = dueDate.isValid() ? dueDate.format('MM/DD/YYYY') : '';
    }

    if (values.frequency) {
      billingProfile.frequency = values.frequency;
    }

    if (typeof values.non_profit_status === 'boolean') {
      billingProfile.non_profit_status = values.non_profit_status.toString();
    }

    if (values.status) {
      billingProfile.status = values.status;
    }

    if (values.subscription_start_date) {
      const subscriptionStartDate = moment(values.subscription_start_date);
      billingProfile.subscription_start_date = subscriptionStartDate.isValid()
        ? subscriptionStartDate.format('MM/DD/YYYY')
        : '';
    }

    if (typeof values.tax_exempt_status === 'boolean') {
      billingProfile.tax_exempt_status = values.tax_exempt_status.toString();
    }

    // billing contact

    if (values.contact_email) {
      billingProfile.contact.email = values.contact_email;
    }

    if (values.contact_first_name) {
      billingProfile.contact.first_name = values.contact_first_name;
    }

    if (values.contact_last_name) {
      billingProfile.contact.last_name = values.contact_last_name;
    }

    if (values.contact_phone) {
      billingProfile.contact.phone = values.contact_phone;
    }

    // billing address

    if (values.contact_address1) {
      billingProfile.contact.address.address1 = values.contact_address1;
    }

    if (values.contact_address2) {
      billingProfile.contact.address.address2 = values.contact_address2;
    }

    if (values.contact_city) {
      billingProfile.contact.address.city = values.contact_city;
    }

    if (values.contact_country) {
      billingProfile.contact.address.country = values.contact_country;
    }

    billingProfile.contact.address.setStateOrProvinceForCountry(
      values.contact_country,
      values.contact_state,
      values.contact_province
    );

    billingProfile.contact.address.setZipOrPostalCodeForCountry(
      values.contact_country,
      values.contact_zip_code,
      values.contact_postal_code
    );

    return billingProfile;
  }
}
