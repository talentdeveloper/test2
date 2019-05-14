import * as moment from 'moment';

import { Directive, forwardRef, Attribute, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

@Directive({
    // create selector map
    selector: '[formControl][compareToStartControl],[formControl][compareToEndControl],[formControlName][compareToStartControl],[formControlName][compareToEndControl]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => DateRangeValidator), multi: true }
    ]
})
export class DateRangeValidator implements Validator {
    @Input('compareToStartControl') public compareToStartControl: AbstractControl;
    @Input('compareToEndControl') public compareToEndControl : AbstractControl;

    validate(control: AbstractControl): { [key: string]: any } {
        // for this to operate, we want all validators to run before this does
        // to simplify the implementation and reusability, we're using a delayed validator
        // so future forms don't need to implement a custom composed validator where
        // order is sync
        setTimeout(() => {
            if (this.compareToStartControl) {
                return this.evalValidRange(
                    this.compareToStartControl,
                    control,
                    'startDate',
                    (subjectDate, instanceDate) => instanceDate.isAfter(subjectDate)
                );
            }

            if (this.compareToEndControl) {
                return this.evalValidRange(
                    this.compareToEndControl,
                    control,
                    'endDate',
                    (subjectDate, instanceDate) => subjectDate.isAfter(instanceDate)
                );
            }
        }, 1);

        return null;
    }

    evalValidRange(subjectControl, instanceControl, validatorName : string, validator: (start, end) => boolean) {
        // if control isn't defined, this validator will default to true
        if (!subjectControl) {
            return null;
        }

        // ensure there's no date or required errors on either field before checking the range
        if (this.checkPrerequisiteValidators(subjectControl) && this.checkPrerequisiteValidators(instanceControl)) {
            if (!validator(moment(subjectControl.value), moment(instanceControl.value))) {
                return instanceControl.setErrors({[validatorName]: true});
            }
        }

        return null;
    }

    checkPrerequisiteValidators(control : AbstractControl) {
        const prerequisiteValidators = ['required', 'date'];

        return !control.errors || prerequisiteValidators.every(name => !control.errors[name]);
    }
}