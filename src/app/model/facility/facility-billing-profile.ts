import { BILLING_STATUS_ACTIVE, BILLING_STATUS_INACTIVE } from '../account/account-billing-profile';
import { Contact } from '../contact';


// --- define facility billing profile model ---

export class FacilityBillingProfile {
    contact: Contact;
    non_profit: boolean;
    status: string;
    tax_exempt: boolean;

    constructor(
        contact: Contact = new Contact(),
        status: string = BILLING_STATUS_ACTIVE,
        non_profit: boolean = false,
        tax_exempt: boolean = false
    ) {
        this.contact = contact;
        this.non_profit = non_profit;
        this.status = status;
        this.tax_exempt = tax_exempt;
    }
}

export class FacilityBillingProfileFactory {
    static create(form : any = {}) {
        return <FacilityBillingProfile> Object.assign(new FacilityBillingProfile(), form);
    }
}
