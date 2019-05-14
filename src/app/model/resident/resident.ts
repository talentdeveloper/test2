import { Attachment } from '../attachment/attachment';
import { ResidentContactList } from './resident-contact-list';
import { skillLevelMap, skillLevel } from '../content/content';
import { SyncGatewayModel } from '../sync-gateway/sync-gateway-model';

export const RESIDENT_PROFILE_IMAGE_FILENAME = 'profile_image';
export const RESIDENT_CONTACT_IMAGE_FILENAME_PREFIX = 'contact_image_';

export const RESIDENT_STATUS_ACTIVE = 'active';
export const RESIDENT_STATUS_INACTIVE = 'inactive';

// --- define resident models ---

export class Resident extends SyncGatewayModel {
  account_id: string;
  birthdate: string;
  serial_numbers: string[];
  facility_id: string;
  family: ResidentContactList;
  first_name: string;
  last_name: string;
  pin: string;
  room_number: string;
  skill_level: number;
  status: string;
  type = 'resident';
  recommended_search_terms = '';

  constructor(
    account_id: string = '',
    birthdate: string = '',
    facility_id: string = '',
    family: ResidentContactList = new ResidentContactList(),
    first_name: string = '',
    last_name: string = '',
    pin: string = '',
    recommended_search_terms: string = '',
    room_number: string = '',
    serial_numbers: string[] = [],
    skill_level: number = skillLevel.LEVEL_THREE,
    status: string = '',
    _id?: string,
    _rev?: string,
    _attachments?: Map<string, Attachment>,
    created_by?: string,
    created_date?: string,
    modified_by?: string,
    modified_date?: string
  ) {
    super(_id, _rev, _attachments, created_by, created_date, modified_by, modified_date);

    this.account_id = account_id;
    this.birthdate = birthdate;
    this.serial_numbers = serial_numbers;
    this.facility_id = facility_id;
    this.family = family;
    this.first_name = first_name;
    this.last_name = last_name;
    this.pin = pin;
    this.room_number = room_number;
    this.recommended_search_terms = recommended_search_terms;
    this.skill_level = skill_level;
    this.status = status;
  }

  getSkillLevelName() {
    const skillLevel = skillLevelMap.find(level => level.value === this.skill_level);
    return skillLevel ? skillLevel.label : '';
  }

  hasProfileImage() {
    return this.hasAttachmentWithName(RESIDENT_PROFILE_IMAGE_FILENAME);
  }

  getContactImageName(phone?: string): string {
    const strippedPhone = phone.replace(/[^0-9]/g, '');
    return RESIDENT_CONTACT_IMAGE_FILENAME_PREFIX + strippedPhone;
  }

  hasContactImage(phone: string): boolean {
    return this.hasAttachmentWithName(this.getContactImageName(phone));
  }

  isActive() {
    // Residents exist in that database without a status property set. We want to consider
    // these residents as 'active' residents.
    return this.status === RESIDENT_STATUS_ACTIVE || this.status === '';
  }
}
