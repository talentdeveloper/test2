import { ResidentContact } from './resident-contact';


export class ResidentContactList {
    members: Array<ResidentContact>;
    skype_user: string; // this skype_user value is deprecated; use ResidentContact instead

    constructor(members: Array<ResidentContact> = []) {
        this.members = members;
    }
}

