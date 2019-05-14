import { Address } from './address';

export class Contact {
    address: Address;
    email = '';
    first_name = '';
    last_name = '';
    phone = '';

    constructor(
        email: string = '',
        first_name: string = '',
        last_name: string = '',
        phone: string = '',
        address: Address = new Address()
    ) {
        this.email = email;
        this.first_name = first_name;
        this.last_name = last_name;
        this.phone = phone;
        this.address = address;
    }
}
