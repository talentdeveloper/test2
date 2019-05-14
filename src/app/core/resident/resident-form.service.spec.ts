import { FormBuilder } from '@angular/forms';
import { TestBed, inject } from '@angular/core/testing';

import { Resident } from '../../model/resident/resident';
import { ResidentContact } from '../../model/resident/resident-contact';
import { ResidentFormService } from './resident-form.service';

describe('ResidentFormService', () => {
  let formBuilder: FormBuilder;
  let residentFormService: ResidentFormService;
  let residentWithContact: Resident;
  let residentWithoutContact: Resident;
  let residentContact: ResidentContact;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FormBuilder,
        ResidentFormService
      ]
    });

    residentWithContact = new Resident();
    residentWithContact.family.members.push(new ResidentContact());
    residentWithContact.family.members[0].first_name = 'Joe';
    residentWithContact.family.members[0].phone = '1 (303) 987-6543';

    residentWithoutContact = new Resident();

    residentContact = new ResidentContact();
    residentContact.first_name = 'Bill';
    residentContact.phone = '1 (303) 123-4567';
  });

  beforeEach(inject([FormBuilder, ResidentFormService], (_formBuilder: FormBuilder, _residentFormService: ResidentFormService) => {
    formBuilder = _formBuilder;
    residentFormService = _residentFormService;
  }));

  describe('formGroupFromContact', () => {
    it('should return a new form group for a contact', () => {
      const formArray = formBuilder.array([]);
      const formGroup = residentFormService.formGroupFromContact(residentContact, formArray);
      expect(formGroup.get('first_name').value).toBe(residentContact.first_name);
      expect(formGroup.get('phone').value).toBe(residentContact.phone);
      expect(formGroup.get('first_name').hasError('required')).toBe(false);
      expect(formGroup.get('phone').hasError('required')).toBe(false);
      expect(formGroup.get('phone').hasError('notUnique')).toBe(false);
    });

  });
});
