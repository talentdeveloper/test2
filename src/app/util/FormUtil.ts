import { FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { EventEmitter, Output } from '@angular/core';
import * as moment from 'moment';


export class FormUtil {
    static markAllAsTouched(fb: FormGroup) {
        Object.keys(fb.controls || {}).forEach((childFb) => {
            const node = fb.controls[childFb];

            if (node instanceof FormControl) {
                node.markAsTouched();
            }

            if (node instanceof FormArray) {
                for (let i = 0; i < node.length; ++i) {
                    FormUtil.markAllAsTouched(<FormGroup> node.at(i));
                }
            }

            if (node instanceof FormGroup) {
                FormUtil.markAllAsTouched(node);
            }
        });
    }
}

export abstract class BaseFormComponent {
    @Output() onSubmit: EventEmitter<any> = new EventEmitter<any>();
    @Output() onCancel: EventEmitter<any> = new EventEmitter<any>();

    errorMessage: string;
    successMessage: string;
    form: FormGroup;

    required(formControl: FormControl): boolean {
        return this.hasError(formControl, 'required');
    }

    hasError(formControl, errorProperty: string): boolean {
        return formControl.hasError(errorProperty);
    }

    // date error check, looks for both 'date' and 'dateExists' errors
    hasDateError(formControl: FormControl): boolean {
        return this.modified(formControl) && (formControl.hasError('date') || formControl.hasError('dateNonExistent'));
    }

    modified(formControl: FormControl): boolean {
        return formControl.dirty || formControl.touched;
    }

    resetMessages() {
        this.errorMessage = '';
        this.successMessage = '';
    }
}



// custom validators for the in2l focus app
export class AppValidator {
    static dateExists = (dateFormat: string = 'MM/DD/YYYY'): ValidatorFn => {
        return (control: FormControl) => {
            // if valid, validatorFn must return null
            // otherwise, return an error object ex: { validator_key: 'message' }
            const dateValue = control.value;

            if ( dateValue && !moment(dateValue, dateFormat, true).isValid() ) {
                return { dateNonExistent: 'This date does not exist' };
            }

            return null;
        };
    }
}
