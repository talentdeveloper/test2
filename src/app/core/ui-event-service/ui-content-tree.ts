import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IContentTreeRefreshMessage extends IUiEventMessage {
  id?: string;
  deleted?: boolean;
}

export class RefreshBaseMessage extends UiEventMessage implements IContentTreeRefreshMessage {
  id;

  constructor(message: IContentTreeRefreshMessage) {
    super();

    this.id = message.id;
  }
}
export class RefreshRootMessage extends UiEventMessage {
  id: string;
  deleted: boolean;

  constructor(id?: string, deleted?: boolean) {
    super();

    this.id = id || '';
    this.deleted = !!deleted;
  }
}

export class ContentChangedMessage extends UiEventMessage {
  contentId: string;
  deleted: boolean;
  doc: any;
  isLocalModification: boolean;

  constructor(
    contentId: string,
    deleted: boolean = false,
    doc: any = null,
    isLocalModification: boolean = false
  ) {
    super();

    this.contentId = contentId;
    this.deleted = deleted;
    this.doc = doc;
    this.isLocalModification = isLocalModification;
  }
}
