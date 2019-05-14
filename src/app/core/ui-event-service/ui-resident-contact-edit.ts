import {
    FormGroup, FormBuilder, Validators,
    FormArray, FormControl
} from '@angular/forms';

import { IUiEventMessage, UiEventMessage } from './ui-event-service';
import { Resident } from '../../model/resident/resident';
import { ResidentContact } from '../../model/resident/resident-contact';
import { ResidentContactList } from '../../model/resident/resident-contact-list';

export interface IResidentContactEditMessage extends IUiEventMessage {
    resident: Resident;
    contactForm: FormGroup;
}

export class ResidentContactEditMessage extends UiEventMessage implements IResidentContactEditMessage {
    resident: Resident;
    contactForm: FormGroup;

    constructor(message : IResidentContactEditMessage) {
        super();

        this.resident = message.resident;
        this.contactForm = message.contactForm;
    }
}
