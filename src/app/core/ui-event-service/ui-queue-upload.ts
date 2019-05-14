import { Content, IContent } from '../../model/content/content';
import { ContentLibraryInterfaces as CLI } from '../../model/content-library';
import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IQueueUploadMessage extends IUiEventMessage {
  content: IContent | CLI.IContentItem;
  s3_key: string;
  file: File;
}

export class QueueUploadMessage extends UiEventMessage implements IQueueUploadMessage {
  content: IContent | CLI.IContentItem;
  s3_key: string;
  file: File;

  constructor(message: IQueueUploadMessage) {
    super();

    this.content = message.content;
    this.s3_key = message.s3_key;
    this.file = message.file;
  }
}

export class UploadFailedMessage extends UiEventMessage {
  key: string;

  constructor(key: string) {
    super();
    this.key = key;
  }
}
