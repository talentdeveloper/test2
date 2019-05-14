import { Attachment } from '../attachment/attachment';
import { BaseUser, USER_TYPE_ACCOUNT_ADMIN } from './user';


export class AccountAdminUser extends BaseUser {
    account_id: string;
    phone: string;
    title: string;
    type: string = USER_TYPE_ACCOUNT_ADMIN;

    constructor(
        account_id: string = '',
        email: string = '',
        first_name: string = '',
        last_name: string = '',
        phone: string = '',
        status: string = '',
        title: string = '',
        type: string = '',
        _id?: string,
        _rev?: string,
        _attachments?: Map<string, Attachment>
    ) {
        super(email, first_name, last_name, status, USER_TYPE_ACCOUNT_ADMIN, _id, _rev, _attachments);

        this.account_id = account_id;
        this.phone = phone;
        this.title = title;
    }
}
