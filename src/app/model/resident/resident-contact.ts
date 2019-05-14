export interface IResidentContact {
  name?: string;
  first_name?: string;
  last_name?: string;
  relation?: string;
  description?: string;
  email?: string;
  phone?: string;
  skype_user?: string;
  twilio_blacklist?: string;
  twilio_blacklist_date?: string;
}

export class ResidentContact {
  // "name" is the field formerly used to hold the family member's first name
  name: string;

  first_name: string;
  last_name: string;
  relation: string;
  description: string;
  email: string;
  phone: string;
  skype_user: string;
  twilio_blacklist: string;
  twilio_blacklist_date: string;

  constructor(data?: IResidentContact) {
    data = data || ({} as IResidentContact);

    this.name = this.name || '';
    this.first_name = this.first_name || '';
    this.last_name = this.last_name || '';
    this.relation = this.relation || '';
    this.description = this.description || '';
    this.email = this.email || '';
    this.phone = data.phone || '';
    this.skype_user = data.skype_user || '';
    this.twilio_blacklist = data.twilio_blacklist || 'false';
    this.twilio_blacklist_date = data.twilio_blacklist_date || '';
  }
}
