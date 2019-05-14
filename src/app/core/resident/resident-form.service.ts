import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';

import { AppValidator } from '../../util/FormUtil';
import { InputService } from '../input/input.service';
import { Resident } from '../../model/resident/resident';
import { ResidentContact } from '../../model/resident/resident-contact';
import { skillLevel } from '../../model/content/content';

@Injectable()
export class ResidentFormService {
  constructor(private fb: FormBuilder) {}

  buildContactsFormArray(resident: Resident): FormArray {
    const formArray = this.fb.array([]);

    resident.family.members.forEach((contact: ResidentContact) => {
      formArray.push(this.formGroupFromContact(contact, formArray));
    });

    return formArray;
  }

  buildResidentForm(resident: Resident, editMode: boolean, contactsForm: FormArray): FormGroup {
    return this.fb.group({
      birthdate: [
        editMode ? resident.birthdate : null,
        Validators.compose([CustomValidators.date, AppValidator.dateExists()])
      ],
      first_name: [editMode ? resident.first_name : null, Validators.required],
      last_name: [editMode ? resident.last_name : null, Validators.required],
      pin: [
        editMode ? resident.pin : null,
        Validators.compose([
          Validators.required,
          Validators.pattern(InputService.PIN_VALIDATION_PATTERN)
        ])
      ],
      room_number: [editMode ? resident.room_number : null],
      recommended_search_terms: [editMode ? resident.recommended_search_terms : null],
      skill_level: [editMode ? resident.skill_level : skillLevel.LEVEL_THREE],
      family: this.fb.group({
        members: contactsForm
      })
    });
  }

  newContactFormGroup(contactsFormArray: FormArray): FormGroup {
    return this.formGroupFromContact(new ResidentContact(), contactsFormArray, true);
  }

  formGroupFromContact(
    contact: ResidentContact,
    contactsFormArray: FormArray,
    isNew: boolean = false
  ): FormGroup {
    return this.fb.group({
      name: [contact.name || ''],
      first_name: [
        contact.first_name || contact.name || '',
        Validators.compose([Validators.required, Validators.maxLength(18)])
      ],
      last_name: [contact.last_name || '', Validators.compose([Validators.maxLength(18)])],
      relation: [contact.relation || '', Validators.compose([Validators.maxLength(100)])],
      description: [contact.description || '', Validators.compose([Validators.maxLength(200)])],
      email: [contact.email || '', CustomValidators.email],
      phone: [contact.phone || '', Validators.compose([Validators.required])],
      skype_user: [contact.skype_user || ''],
      twilio_blacklist: [contact.twilio_blacklist || 'false'],
      twilio_blacklist_date: [contact.twilio_blacklist_date || ''],
      contact_image_data: [''],
      is_duplicate_phone: [
        false,
        Validators.compose([
          (formControl: AbstractControl): { [key: string]: any } => {
            return formControl.value ? { notUnique: { value: formControl.value } } : null;
          }
        ])
      ],
      remove_contact_image: ['false']
    });
  }
}
