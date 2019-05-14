import { UUID } from 'angular2-uuid';
import { Attachment } from '../attachment/attachment';

export interface IMessage {
    _id: string;
    _attachments?: Map<string, Attachment>;
    created_by: string;
    created_date: string;
    read_by: Object;
    recipient_id: string;
    type: string;
    body: string;
    from_name: string;
}

export class Message implements IMessage {
    _id;
    _attachments;
    created_by;
    created_date;
    read_by = {};
    recipient_id;
    type;
    body;
    from_name;


    constructor(data?: IMessage) {
        if (!data) {
            this._id = UUID.UUID();
        } else {
            this._id = data._id;
            this.created_by = data.created_by;
            this.created_date = data.created_date;
            this.read_by = data.read_by;
            this.recipient_id = data.recipient_id;
            this.type = data.type;
            this._attachments = data._attachments;
            this.body = data.body;
            this.from_name = data.from_name;
        }
    }
}

export class FacilityMessage extends Message {
    type = 'facility_message';
}

export class AccountMessage extends Message {
    type = 'account_message';
}

export class ResidentMessage extends Message {
    type = 'resident_message';
};
