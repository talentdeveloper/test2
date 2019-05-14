import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export class SidebarSizeChangeMessage extends UiEventMessage {
    constructor(public sidebarIsCollapsed: boolean) {
        super();
    }
}
