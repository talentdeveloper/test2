import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface ILoadingMessage extends IUiEventMessage {
    enabled : boolean;
}

export class LoadingMessage extends UiEventMessage {
    enabled;

    constructor(data : ILoadingMessage) {
        super();

        this.enabled = data.enabled;
    }
}
