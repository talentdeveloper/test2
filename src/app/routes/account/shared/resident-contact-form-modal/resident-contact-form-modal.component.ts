import * as _ from 'lodash';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';

import { BaseFormComponent } from '../../../../util/FormUtil';
import { ImageCropControlComponent } from '../../../../shared/components/image-crop-control/image-crop-control.component';
import { InputService } from '../../../../core/input/input.service';
import { Resident } from '../../../../model/resident/resident';
import { ResidentContactAddMessage } from '../../../../core/ui-event-service/ui-resident-contact-add';
import { ResidentContactEditMessage } from '../../../../core/ui-event-service/ui-resident-contact-edit';
import { ResidentService } from '../../../../core/resident/resident.service';
import { UiEventService } from '../../../../core/ui-event-service/ui-event-service';

@Component({
  selector: 'app-resident-contact-form-modal',
  templateUrl: './resident-contact-form-modal.component.html',
  styleUrls: ['./resident-contact-form-modal.component.scss']
})
export class ResidentContactFormModalComponent extends BaseFormComponent
  implements OnDestroy, OnInit {
  @ViewChild('residentContactModal')
  modal: ModalDirective;

  @ViewChild('contactImageCropControl', undefined)
  contactImageCropControl: ImageCropControlComponent;

  active: boolean;

  editMode: boolean;

  resident: Resident;
  contactsArray: FormArray;
  originalContactForm: FormGroup;
  contactForm: FormGroup;
  hasContactImage: boolean;
  contactImageSrc: string;
  removeContactImage = false;

  phoneMask: Array<string | RegExp> = InputService.US_INT_PHONE_MASK;

  constructor(
    protected fb: FormBuilder,
    protected residentService: ResidentService,
    protected uiEventService: UiEventService
  ) {
    super();
  }

  ngOnInit() {
    this.active = true;

    this.uiEventService.subscribe(ResidentContactAddMessage, message => {
      if (!this.active) {
        return;
      }

      this.resident = message.resident;
      this.contactsArray = message.contactsArray;
      this.contactForm = message.contactForm;

      this.editMode = false;

      this.modal.show();
    });

    this.uiEventService.subscribe(ResidentContactEditMessage, message => {
      if (!this.active) {
        return;
      }

      this.resident = message.resident;
      this.originalContactForm = message.contactForm;
      this.contactForm = _.cloneDeep(this.originalContactForm);

      this.contactForm.get('is_duplicate_phone').setValue(false);

      const phone = this.contactForm.get('phone').value;
      this.hasContactImage = this.resident.hasContactImage(phone);

      this.contactImageSrc =
        this.contactForm.get('contact_image_data').value ||
        this.residentService.getContactImagePath(this.resident, phone);

      this.editMode = true;

      this.modal.show();
    });
  }

  ngOnDestroy() {
    this.active = false;
  }

  submitForm($event, value) {
    const imageBase64Data = this.contactImageCropControl.getCroppedImageBase64Data();

    if (imageBase64Data) {
      this.contactForm.get('contact_image_data').setValue(imageBase64Data);
    }

    if (this.removeContactImage) {
      this.contactForm.get('remove_contact_image').setValue(true);
      delete this.resident._attachments[
        this.resident.getContactImageName(this.contactForm.get('phone').value)
      ];
    }

    this.setFullName();

    if (this.editMode) {
      this.saveFormValue('name');
      this.saveFormValue('first_name');
      this.saveFormValue('last_name');
      this.saveFormValue('relation');
      this.saveFormValue('description');
      this.saveFormValue('email');
      this.saveFormValue('phone');
      this.saveFormValue('skype_user');
      this.saveFormValue('contact_image_data');
    } else {
      this.contactsArray.push(this.contactForm);
    }

    this.closeModal();
  }

  markRemoveProfileImage() {
    this.removeContactImage = true;
    this.contactImageSrc = '';
    this.contactForm.get('contact_image_data').setValue('');
  }

  clearModal() {
    this.contactImageCropControl.cancelUpload();
  }

  closeModal() {
    this.clearModal();

    this.modal.hide();
  }

  private setFullName() {
    const firstName = this.contactForm.get('first_name').value;
    const lastName = this.contactForm.get('last_name').value || '';
    this.contactForm.get('name').setValue((firstName + ' ' + lastName).trim());
  }

  private saveFormValue(field: string) {
    this.originalContactForm.get(field).setValue(this.contactForm.get(field).value);
  }
}
