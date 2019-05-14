import * as _ from 'lodash';

import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IToasterMessage extends IUiEventMessage {
    body: string;
    title?: string;
    type: 'error' | 'info' | 'success' | 'wait' | 'warning';
    options?: {
        mouseoverTimerStop?: boolean,
        timeout?: {
            error?: number,
            info?: number,
            success?: number,
            wait?: number,
            warning?: number
        },
        showCloseButton: boolean
    };
}

export class ToasterMessage extends UiEventMessage implements IToasterMessage {
    body;
    title;
    type;
    options;

    constructor(message: IToasterMessage) {
        super();

        this.body = _.get(message, 'body', '');
        this.type = _.get(message, 'type', 'info');
        this.options = _.get(message, 'options', null);

        // default title to formatted type if not set
        this.title = _.get(message, 'title', this.type.substr(0, 1).toUpperCase() + this.type.substr(1));
    }
}
