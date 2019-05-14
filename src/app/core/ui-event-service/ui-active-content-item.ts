import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IActiveContentItem extends IUiEventMessage {
    id : string;
}

export class ActiveContentItemMessage extends UiEventMessage {
    id;

    constructor(data : IActiveContentItem) {
        super();

        this.id = data.id;
    }
}
