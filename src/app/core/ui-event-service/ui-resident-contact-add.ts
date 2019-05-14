import {
    FormGroup, FormBuilder, Validators,
    FormArray, FormControl
} from '@angular/forms';

import { IUiEventMessage, UiEventMessage } from './ui-event-service';
import { Resident } from '../../model/resident/resident';
import { ResidentContact } from '../../model/resident/resident-contact';
import { ResidentContactList } from '../../model/resident/resident-contact-list';

export interface IResidentContactAddMessage extends IUiEventMessage {
    resident: Resident;
    contactsArray: FormArray;
    contactForm: FormGroup;
}

export class ResidentContactAddMessage extends UiEventMessage implements IResidentContactAddMessage {
    resident: Resident;
    contactsArray: FormArray;
    contactForm: FormGroup;

    constructor(message: IResidentContactAddMessage) {
        super();

        this.resident = message.resident;
        this.contactsArray = message.contactsArray;
        this.contactForm = message.contactForm;
    }
}
