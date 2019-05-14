import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IContentMessage extends IUiEventMessage {
    id : string;
    title : string;
}

export class BaseContentMessage extends UiEventMessage implements IContentMessage {
    id;
    title;

    constructor(message: IContentMessage) {
        super();

        this.id = message.id;
        this.title = message.title;
    }
}
export class DeleteContentMessage extends BaseContentMessage {}
export class DeleteContainerMessage extends BaseContentMessage {}
