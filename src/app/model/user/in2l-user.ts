import { Attachment } from '../attachment/attachment';
import { BaseUser, USER_TYPE_IN2L } from './user';

export class IN2LUser extends BaseUser {
    type: string = USER_TYPE_IN2L;

    constructor(
        email: string = '',
        first_name: string = '',
        last_name: string = '',
        status: string = '',
        type: string = '',
        _id?: string,
        _rev?: string,
        _attachments?: Map<string, Attachment>
    ) {
        super(email, first_name, last_name, status, USER_TYPE_IN2L, _id, _rev, _attachments);
    }
}
