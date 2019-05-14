import { Address, ADDRESS_COUNTRY_CANADA } from '../address';
import { Contact } from '../contact';

// --- define account profile model ---

export class AccountProfile {
    account_name: string;
    contact: Contact;
    corporate_id: string;
    crm_id: string;
    manager: string;
    notes: string;
    owner: string;

    constructor(
        account_name: string = '',
        contact: Contact = new Contact(),
        corporate_id: string = '',
        crm_id: string = '',
        manager: string = '',
        notes: string = '',
        owner: string = ''
    ) {
        this.account_name = account_name;
        this.contact = contact;
        this.corporate_id = corporate_id;
        this.crm_id = crm_id;
        this.manager = manager;
        this.notes = notes;
        this.owner = owner;
    }
};


// --- create an empty base account profile --

export const EmptyAccountProfile = new AccountProfile();


// --- create an account profile factory for building a new account profile --

export class AccountProfileFactory {

    createAccountProfileFromFormValues(values): AccountProfile {

        const profile = new AccountProfile();
        profile.contact = new Contact();
        profile.contact.address = new Address();


        if (!values) {
            return profile;
        }


        // root level profile properties

        if (values.account_name) {
            profile.account_name = values.account_name;
        }

        if (values.corporate_id) {
            profile.corporate_id = values.corporate_id;
        }

        if (values.crm_id) {
            profile.crm_id = values.crm_id.trim();
        }

        if (values.manager) {
            profile.manager = values.manager;
        }

        if (values.notes) {
            profile.notes = values.notes;
        }

        if (values.owner) {
            profile.owner = values.owner;
        }


        // profile contact

        if (values.email) {
            profile.contact.email = values.email;
        }

        if (values.phone) {
            profile.contact.phone = values.phone;
        }


        // profile address

        if (values.address1) {
            profile.contact.address.address1 = values.address1;
        }

        if (values.address2) {
            profile.contact.address.address2 = values.address2;
        }

        if (values.city) {
            profile.contact.address.city = values.city;
        }

        if (values.country) {
            profile.contact.address.country = values.country;
        }

        profile.contact.address.setStateOrProvinceForCountry(values.country, values.state, values.province);
        profile.contact.address.setZipOrPostalCodeForCountry(values.country, values.zip_code, values.postal_code);

        return profile;
    }
}
