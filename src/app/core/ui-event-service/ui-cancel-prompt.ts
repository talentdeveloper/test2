import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface ICancelPromptMessage extends IUiEventMessage {
}

export class CancelPromptMessage extends UiEventMessage implements ICancelPromptMessage {
}
