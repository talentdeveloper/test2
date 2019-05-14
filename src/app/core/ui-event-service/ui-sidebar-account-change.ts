import { IUiEventMessage, UiEventMessage } from './ui-event-service';


export interface ISidebarAccountChange extends IUiEventMessage {
    accountId: string;
    facilityId?: string;
    preventNavigateToDefault: boolean;
}

export class SidebarAccountChangeMessage extends UiEventMessage {
    accountId: string;
    facilityId: string;
    preventNavigateToDefault: boolean;

    constructor(data: ISidebarAccountChange) {
        super();

        this.accountId = data.accountId;
        this.facilityId = data.facilityId || '';
        this.preventNavigateToDefault = data.preventNavigateToDefault || false;
    }
}
