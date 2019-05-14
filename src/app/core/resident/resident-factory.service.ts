import {
  Resident,
  RESIDENT_STATUS_ACTIVE,
  RESIDENT_CONTACT_IMAGE_FILENAME_PREFIX
} from '../../model/resident/resident';
import { ResidentContactList } from '../../model/resident/resident-contact-list';
import { skillLevel } from '../../model/content/content';

// --- create a resident factory for building a new resident object --

export class ResidentFactoryService {
  createResidentFromFormValues(form): Resident {
    if (!form) {
      return new Resident();
    }

    const resident = new Resident(
      form.account_id,
      form.birthdate,
      form.facility_id,
      new ResidentContactList(form.family.members),
      form.first_name,
      form.last_name,
      form.pin,
      form.recommended_search_terms,
      form.room_number,
      form.serial_numbers,
      form.skill_level ? parseInt(form.skill_level, 10) : skillLevel.LEVEL_THREE,
      RESIDENT_STATUS_ACTIVE // when creating a resident, start in active status
    );

    return resident;
  }

  updateResidentFromFormValues(resident: Resident, form): Resident {
    resident.birthdate = form.birthdate;
    resident.skill_level = form.skill_level
      ? parseInt(form.skill_level, 10)
      : skillLevel.LEVEL_THREE;
    resident.first_name = form.first_name;
    resident.last_name = form.last_name;
    resident.pin = form.pin;
    resident.room_number = form.room_number;
    resident.family.members = form.family.members; // this.residentContactsFromForm(form.family.members);
    resident.recommended_search_terms = form.recommended_search_terms;

    for (let i = 0; i < resident.family.members.length; i++) {
      const contact = resident.family.members[i];
      if (contact['remove_contact_image'] === 'true') {
        delete contact['remove_contact_image'];
        const phone = contact.phone.replace(/[^0-9]/g, '');
        const contact_image_name = RESIDENT_CONTACT_IMAGE_FILENAME_PREFIX + phone;
        delete resident._attachments[contact_image_name];
      }
    }

    return resident;
  }

  createResidentFromCouchbaseResult(result): Resident {
    const resident = new Resident();

    resident.mergeCouchbaseDocumentData(result);

    return resident;
  }
}
