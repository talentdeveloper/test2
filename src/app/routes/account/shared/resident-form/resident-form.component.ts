import * as _ from 'lodash';

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { BaseFormComponent, FormUtil } from '../../../../util/FormUtil';
import { Device } from '../../../../model/device/device';
import { DeviceService } from '../../../../core/device/device.service';
import { Facility } from '../../../../model/facility/facility';
import { ImageCropControlComponent } from '../../../../shared/components/image-crop-control/image-crop-control.component';
import { InputService } from '../../../../core/input/input.service';
import { Resident } from '../../../../model/resident/resident';
import { ResidentFactoryService } from '../../../../core/resident/resident-factory.service';
import { ResidentFormService } from '../../../../core/resident/resident-form.service';
import { ResidentService } from '../../../../core/resident/resident.service';
import { skillLevelMap, LabelValueMap } from '../../../../model/content/content';
import { TextMessageService } from '../../../../core/text-message/text-message.service';
import { ToasterMessage } from '../../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../../core/ui-event-service/ui-event-service';
import { ResidentContactAddMessage } from '../../../../core/ui-event-service/ui-resident-contact-add';
import { ResidentContactEditMessage } from '../../../../core/ui-event-service/ui-resident-contact-edit';
import { LoaderService } from '../../../../core/loader/loader.service';

const COMPONENT_NAME = 'resident-form';

const PHONE_NUMBER_ADDED = 'phone_added';
const PHONE_NUMBER_REMOVED = 'phone_removed';

interface IContactPhoneChange {
  name: string;
  phone: string;
  change: string; // should be either PHONE_NUMBER_ADDED or PHONE_NUMBER_REMOVED
}

@Component({
  selector: 'app-resident-form',
  templateUrl: './resident-form.component.html',
  styles: [
    '.blacklisted { margin-bottom: 10px; padding-top: 8px; padding-bottom: 8px; background-color: #e3eefd; }',
    '.blacklisted .form-group { margin-bottom: 5px }',
    '.datepicker-input { background: transparent; border-bottom: none !important; }'
  ]
})
export class ResidentFormComponent extends BaseFormComponent implements OnInit {
  @Input()
  editMode?: boolean;
  @Input()
  resident?: Resident;
  @Input()
  accountId: string;
  @Input()
  facility: Facility;

  @ViewChild('cropControl', undefined)
  cropControl: ImageCropControlComponent;

  devices: Array<Device> = [];
  errorMessage: string;
  contactsFormArray: FormArray;
  initialContacts = [];
  residentForm: FormGroup;
  existingImageSrc = '';
  skillLevels: LabelValueMap = skillLevelMap;
  successMessage: string;
  dateMask: Array<string | RegExp> = InputService.DATE_MASK;
  pinMask: Array<string | RegExp> = InputService.PIN_MASK;
  submitInProgress = false;
  removeProfileImage = false;

  constructor(
    private deviceService: DeviceService,
    private location: Location,
    private residentFactoryService: ResidentFactoryService,
    private residentFormService: ResidentFormService,
    private residentService: ResidentService,
    private router: Router,
    private textMessageService: TextMessageService,
    private uiEventService: UiEventService,
    private loaderService: LoaderService
  ) {
    super();
  }

  ngOnInit() {
    this.editMode = !!this.editMode;

    if (!this.resident) {
      this.resident = new Resident();
    }

    // save for later (used in form submit process)
    this.initialContacts = _.get(this.resident, 'family.members', []);

    this.contactsFormArray = this.residentFormService.buildContactsFormArray(this.resident);

    this.residentForm = this.residentFormService.buildResidentForm(
      this.resident,
      this.editMode,
      this.contactsFormArray
    );

    if (this.editMode && this.resident.hasProfileImage()) {
      this.existingImageSrc = this.residentService.getResidentProfileImagePath(this.resident);
    }
  }

  submitForm($event, form) {
    $event.preventDefault();

    if (this.submitInProgress) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    FormUtil.markAllAsTouched(this.residentForm);

    if (this.residentForm.valid) {
      let updateResident: Resident; // variable for new or updated resident object

      this.submitInProgress = true;

      if (this.editMode) {
        updateResident = this.residentFactoryService.updateResidentFromFormValues(
          this.resident,
          form
        );
      } else {
        updateResident = this.residentFactoryService.createResidentFromFormValues(form);
      }

      updateResident.account_id = this.accountId;
      updateResident.facility_id = this.facility._id;

      this.loaderService.start(COMPONENT_NAME);

      // load updated devices list for residents facility
      this.deviceService
        .getDevicesByFacilityId(this.facility._id)
        .flatMap((devices: Device[]) => {
          // update resident if edit mode, we do not need to update
          // devices records here, should already be set from
          // previous device form edits

          if (this.editMode && this.removeProfileImage) {
            return this.residentService.updateResidentRemoveProfileImage(updateResident);
          }

          if (this.editMode) {
            return this.residentService.updateResident(updateResident);
          }

          // for new residents only, update resident device list
          // only include devices where resident_mode is set to 'all'
          // need to include this new resident on devices available
          // to everyone in the facility
          updateResident.serial_numbers = devices
            .filter((device: Device) => device.isInAllResidentMode())
            .map(d => d.serial_number);

          return this.residentService.createResident(updateResident);
        })
        .flatMap((resident: Resident) => {
          // see if we need to update the profile image
          const profileImageBase64Data = this.cropControl.getCroppedImageBase64Data();

          if (profileImageBase64Data) {
            return this.residentService.updateProfileImage(resident, profileImageBase64Data);
          }

          return Observable.of(resident);
        })
        .flatMap((resident: Resident) => {
          if (form.family.members.length === 0) {
            return Observable.of(resident);
          }

          const contacts = form.family.members;

          const recurse = (r: Resident, index: number): Observable<Resident> => {
            const contact = contacts[index];
            return this.residentService
              .updateContactImage(r, contact.phone, contact.contact_image_data)
              .flatMap((upRes: Resident) => {
                index++;
                if (index === contacts.length) {
                  return Observable.of(upRes);
                }

                return recurse(upRes, index);
              });
          };

          return recurse(resident, 0);
        })
        .flatMap((resident: Resident) => {
          // see if we need to send any welcome text messages
          const added_phone_numbers = this.compareContactState(resident).filter(
            (change: IContactPhoneChange) => change.change === PHONE_NUMBER_ADDED
          );

          if (added_phone_numbers.length) {
            return Observable.forkJoin(
              added_phone_numbers.map(change =>
                this.textMessageService.sendWelcome(change.phone, this.facility)
              )
            ).flatMap(() => Observable.of(resident)); // send welcome text is complete, return resident when done
          }

          // no phone numbers added, just pass resident object through
          return Observable.of(resident);
        })
        .subscribe(
          resident => {
            const updateAction = this.editMode ? 'updated' : 'added';
            const toasterMessage = new ToasterMessage({
              body: `Resident has been ${updateAction} `,
              type: 'success'
            });
            this.uiEventService.dispatch(toasterMessage);
            this.submitInProgress = false;
            this.loaderService.stop(COMPONENT_NAME);
            this.resetFormAndRedirect(resident._id);
          },
          error => {
            this.errorMessage = error;
            this.submitInProgress = false;
            this.loaderService.stop(COMPONENT_NAME);
          }
        );
    }
  }

  getContactImageSrc(contact: FormGroup): string {
    const contactImageRemoved = contact.get('remove_contact_image').value === 'true';
    if (contactImageRemoved) {
      return '';
    }

    const contactImageData =
      contact.get('contact_image_data') && contact.get('contact_image_data').value
        ? contact.get('contact_image_data').value
        : '';

    const src =
      contactImageData ||
      this.residentService.getContactImagePath(this.resident, contact.get('phone').value);

    return src;
  }

  addContact() {
    this.uiEventService.dispatch(
      new ResidentContactAddMessage({
        resident: this.resident,
        contactsArray: this.contactsFormArray,
        contactForm: this.residentFormService.newContactFormGroup(this.contactsFormArray)
      })
    );
  }

  editContact(index: number, contactForm: FormGroup) {
    this.uiEventService.dispatch(
      new ResidentContactEditMessage({
        resident: this.resident,
        contactForm: contactForm
      })
    );
  }

  removeContact(index: number) {
    this.contactsFormArray.removeAt(index);
  }

  isMemberBlacklisted(memberControl: FormControl) {
    return memberControl.get('twilio_blacklist').value === 'true';
  }

  cancel() {
    this.location.back();
  }

  isDuplicatePhoneNumber(contactForm: FormGroup): boolean {
    return contactForm.get('is_duplicate_phone').value;
  }

  saveDisabled() {
    this.checkForDuplicatePhoneNumbers();

    const invalid = !this.residentForm.valid;
    const inProgress = this.submitInProgress;

    return invalid || inProgress;
  }

  markRemoveProfileImage() {
    // $event.preventDefault();
    this.removeProfileImage = true;
    this.existingImageSrc = '';
  }

  contactArrayIndexes(): Number[] {
    return Array.from(new Array(this.contactsFormArray.length), (val, index) => index);
  }

  private checkForDuplicatePhoneNumbers() {
    const phoneNumbers = {};
    for (let i = 0; i < this.contactsFormArray.length; i++) {
      const phone = this.contactsFormArray.at(i).get('phone').value;

      this.contactsFormArray
        .at(i)
        .get('is_duplicate_phone')
        .setValue(!!phoneNumbers[phone]);

      phoneNumbers[phone] = true;
    }
  }

  private compareContactState(updatedResident: Resident): IContactPhoneChange[] {
    const updatedContacts = _.get(updatedResident, 'family.members', []);
    const changes: IContactPhoneChange[] = [];

    // create a list of phone numbers
    const initialPhoneNumbers = this.initialContacts
      .filter(fm => fm.phone)
      .map(initial_fm => initial_fm.phone);
    const updatedPhoneNumbers = updatedContacts
      .filter(fm => fm.phone)
      .map(updated_fm => updated_fm.phone);

    if (Array.isArray(updatedContacts) && updatedContacts.length) {
      updatedContacts.forEach(family_member => {
        if (!initialPhoneNumbers.includes(family_member.phone)) {
          changes.push({
            name: family_member.name,
            phone: family_member.phone,
            change: PHONE_NUMBER_ADDED
          });
        }
      });
    }

    if (Array.isArray(this.initialContacts) && this.initialContacts.length) {
      this.initialContacts.forEach(family_member => {
        if (!updatedPhoneNumbers.includes(family_member.phone)) {
          changes.push({
            name: family_member.name,
            phone: family_member.phone,
            change: PHONE_NUMBER_REMOVED
          });
        }
      });
    }

    return changes;
  }

  private resetFormAndRedirect(residentId: string) {
    this.residentForm.reset();
    this.successMessage = 'Resident was saved';
    this.router.navigate([
      '/account',
      this.accountId,
      'facility',
      this.facility._id,
      'resident',
      residentId
    ]);
  }
}
