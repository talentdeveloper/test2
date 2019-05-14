import { Address } from '../address';
import { Contact } from '../contact';

export const FACILITY_TRAINING_TYPE_WEB = 'web';
export const FACILITY_TRAINING_TYPE_ONSITE = 'onsite';

export const FACILITY_TYPE_ASSISTED_LIVING = 'assisted_living';
export const FACILITY_TYPE_MEMORY_CARE = 'memory_care';
export const FACILITY_TYPE_INDEPENDANT_LIVING = 'independent_living';
export const FACILITY_TYPE_SKILLED_NURSING = 'skilled_nursing';
export const FACILITY_TYPE_CCRC = 'ccrc';
export const FACILITY_TYPE_ADULT_DAY = 'adult_day';
export const FACILITY_TYPE_PACE = 'pace';
export const FACILITY_TYPE_HOME_HEALTH = 'home_health';
export const FACILITY_TYPE_HOME_CARE = 'home_care';
export const FACILITY_TYPE_REHAB_THERAPY = 'rehab_therapy';
export const FACILITY_TYPE_GREENHOUSE = 'greenhouse';
export const FACILITY_TYPE_DESIGN_ARCHITECT = 'design_architect';
export const FACILITY_TYPE_HOSPICE = 'hospice';
export const FACILITY_TYPE_OTHER = 'other';

export const FacilityTypes = [
  { name: 'Assisted Living', type: FACILITY_TYPE_ASSISTED_LIVING },
  { name: 'Memory Care', type: FACILITY_TYPE_MEMORY_CARE },
  { name: 'Independent Living', type: FACILITY_TYPE_INDEPENDANT_LIVING },
  { name: 'Skilled Nursing', type: FACILITY_TYPE_SKILLED_NURSING },
  { name: 'CCRC', type: FACILITY_TYPE_CCRC },
  { name: 'Adult Day', type: FACILITY_TYPE_ADULT_DAY },
  { name: 'PACE', type: FACILITY_TYPE_PACE },
  { name: 'Home Health', type: FACILITY_TYPE_HOME_HEALTH },
  { name: 'Home Care', type: FACILITY_TYPE_HOME_CARE },
  { name: 'Rehab Therapy', type: FACILITY_TYPE_REHAB_THERAPY },
  { name: 'Greenhouse', type: FACILITY_TYPE_GREENHOUSE },
  { name: 'Design Architect', type: FACILITY_TYPE_DESIGN_ARCHITECT },
  { name: 'Hospice', type: FACILITY_TYPE_HOSPICE },
  { name: 'Other', type: FACILITY_TYPE_OTHER }
];

export const SUBSCRIPTION_PACKAGE_1 = 'package_1';
export const SUBSCRIPTION_PACKAGE_2 = 'package_2';
export const SUBSCRIPTION_PACKAGE_3 = 'package_3';
export const SUBSCRIPTION_PACKAGE_4 = 'package_4';
export const SUBSCRIPTION_PACKAGE_5 = 'package_5';
export const SUBSCRIPTION_PACKAGE_6 = 'package_6';

export const SubscriptionPackages = [
  { name: 'Package 1', type: SUBSCRIPTION_PACKAGE_1 },
  { name: 'Package 2', type: SUBSCRIPTION_PACKAGE_2 },
  { name: 'Package 3', type: SUBSCRIPTION_PACKAGE_3 },
  { name: 'Package 4', type: SUBSCRIPTION_PACKAGE_4 },
  { name: 'Package 5', type: SUBSCRIPTION_PACKAGE_5 },
  { name: 'Package 6', type: SUBSCRIPTION_PACKAGE_6 }
];

// --- define facility profile model ---

export class FacilityProfile {
  address: Address;
  eden_community_status: boolean;
  facility_types: Array<string>;
  name: string;
  notes: string;
  bed_count: number | '';
  phone: string;
  region: string;
  require_staff_login: boolean;
  subscriptions: Array<string>;
  technical_contact: Contact;
  training_type: string;

  constructor(
    address: Address = <Address>{},
    eden_community_status: boolean = false,
    facility_types: Array<string> = [],
    name: string = '',
    notes: string = '',
    bed_count: number | '' = '',
    phone: string = '',
    region: string = '',
    require_staff_login: boolean = false,
    subscriptions: Array<string> = [],
    technical_contact: Contact = new Contact(),
    training_type: string = ''
  ) {
    this.address = address;
    this.eden_community_status = eden_community_status;
    this.facility_types = facility_types;
    this.name = name;
    this.notes = notes;
    this.bed_count = bed_count;
    this.phone = phone;
    this.region = region;
    this.require_staff_login = !!require_staff_login;
    this.subscriptions = subscriptions;
    this.technical_contact = technical_contact;
    this.training_type = training_type;
  }
}

// --- create an empty base account profile --

export const EmptyFacilityProfile = new FacilityProfile();
