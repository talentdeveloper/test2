import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { BaseFormComponent, FormUtil } from '../../../../util/FormUtil';
import { Message } from '../../../../model/message/message';

export const MAX_BODY_LENGTH = 80;

@Component({
    selector: 'message-form',
    templateUrl: './message-form.component.html'
})
export class MessageFormComponent extends BaseFormComponent implements OnInit {
    @Input() message?: Message;

    constructor (
        protected fb: FormBuilder,
    ) {
        super();
    }

    ngOnInit() {
        this.form = this.fb.group({
            body: [this.message.body, Validators.compose([
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(MAX_BODY_LENGTH)
            ])]
        });
    }

    handleOnSubmit(e, data: any) {
        e.preventDefault();

        FormUtil.markAllAsTouched(this.form);

        if (this.form.valid && this.onSubmit) {
            this.onSubmit.emit(new Message(Object.assign({}, this.message, data)));
        }
    }
}
