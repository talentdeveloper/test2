import { IUiEventMessage, UiEventMessage } from './ui-event-service';

export interface IClearCacheMessage extends IUiEventMessage {
  bucket: string;
  clearAllCaches: boolean;
}

export class ClearCacheMessage extends UiEventMessage implements IClearCacheMessage {
  bucket;
  clearAllCaches;

  constructor(bucket?: string) {
    super();
    if (bucket) {
      this.clearAllCaches = false;
      this.bucket = bucket;
      return;
    }
    this.clearAllCaches = true;
  }
}
