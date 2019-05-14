
export const ADDRESS_COUNTRY_US = 'United States';
export const ADDRESS_COUNTRY_CANADA = 'Canada';

export class Address {
    address1: string;
    address2: string;
    city: string;
    country: string;
    province: string;
    postal_code: string;
    state: string;
    zip_code: string;

    constructor(
        address1: string = '',
        address2: string = '',
        city: string = '',
        country: string = '',
        state: string = '',
        province: string = '',
        zip_code: string = '',
        postal_code: string = ''
    ) {
        this.address1 = address1;
        this.address2 = address2;
        this.city = city;
        this.country = country;
        this.state = state;
        this.province = province;
        this.zip_code = zip_code;
        this.postal_code = postal_code;
    }

    getStateProvince() {
        if (this.country === ADDRESS_COUNTRY_CANADA) {
            return this.province;
        }

        return this.state;
    }

    getPostalZip() {
        if (this.country === ADDRESS_COUNTRY_CANADA) {
            return this.postal_code;
        }

        return this.zip_code;
    }

    setStateOrProvinceForCountry(country: string, state: string = '', province: string = '') {
        if (country === ADDRESS_COUNTRY_CANADA) {
            this.state = '';
            this.province = province;
        } else {
            this.state = state;
            this.province = '';
        }
    }

    setZipOrPostalCodeForCountry(country: string, zip: string = '', postal: string = '') {
        if (country === ADDRESS_COUNTRY_CANADA) {
            this.zip_code = '';
            this.postal_code = postal;
        } else {
            this.zip_code = zip;
            this.postal_code = '';
        }
    }
}
