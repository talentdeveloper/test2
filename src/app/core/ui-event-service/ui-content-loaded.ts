import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IContentLoadedMessage extends IUiEventMessage {
}

export class ContentLoadedMessage extends UiEventMessage implements IContentLoadedMessage {
}
