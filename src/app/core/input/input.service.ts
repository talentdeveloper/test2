import { Injectable } from '@angular/core';

@Injectable()
export class InputService {

    // general MM/DD/YYYY date mask
    static DATE_MASK: Array<string | RegExp> = [ /[01]/, /\d/, '/', /[0123]/, /\d/, '/', /\d/, /\d/, /\d/, /\d/ ];
    // use CustomValidators.date for date validation regex

    // phone mask/validation, no country code
    static PHONE_MASK: Array<string | RegExp> = [
        '(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/
    ];
    static PHONE_VALIDATION_PATTERN: RegExp = /^\(\d{3}\) \d{3}\-\d{4}$/;

    // phone mask/validation, with counrtry code
    // only need to support US and Canada, both use '1'
    static US_INT_PHONE_MASK: Array<string | RegExp> = [
        '1', ' ', '(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/
    ];
    static US_INT_PHONE_VALIDATION_PATTERN: RegExp = /^1 \(\d{3}\) \d{3}\-\d{4}$/;

    // resident pin mask/validation
    static PIN_MASK: Array<string | RegExp> = [ /\d/, /\d/, /\d/, /\d/ ];
    static PIN_VALIDATION_PATTERN: RegExp = /^\d{4}$/;

    static PASSWORD_STRENGTH_VALIDATION: RegExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;
}
