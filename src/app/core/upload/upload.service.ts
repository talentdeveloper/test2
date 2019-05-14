import { Injectable, NgZone } from '@angular/core';

import { AwsService, S3HeaderResponse } from '../aws/aws.service';
import { ContentLibraryInterfaces as CLI, ContentItem } from '../../model/content-library';
import { Content } from '../../model/content/content';
import { ContentService } from '../content/content.service';
import { ProgressService } from './upload-progress-xhr';
import { QueueUploadMessage, UploadFailedMessage } from '../ui-event-service/ui-queue-upload';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { ContentLibraryService } from '../content-library/content-library.service';

export interface IActiveUpload {
  contentId: string;
  s3_key: string;
  fileName: string;
  originalSize: number;
  total: number;
  loaded: number;
  percentComplete: string;
  failed: boolean;
}

interface IUploadProgressEvent {
  total: number;
  loaded: number;
}

@Injectable()
export class UploadService {
  private static activeUploads: IActiveUpload[];

  static markFailedUpload(s3_key: string) {
    const upload = UploadService.activeUploads.find(item => item.s3_key === s3_key);
    upload.failed = true;
  }

  constructor(
    private awsService: AwsService,
    private contentLibraryService: ContentLibraryService,
    private contentService: ContentService,
    private ngZone: NgZone,
    private progressService: ProgressService,
    private uiEventService: UiEventService
  ) {
    UploadService.activeUploads = [];

    this.uiEventService.subscribe(UploadFailedMessage, uploadFailedMessage => {
      UploadService.markFailedUpload(uploadFailedMessage.key);
    });

    // Subscribe to upload messages
    this.uiEventService.subscribe(QueueUploadMessage, (message: QueueUploadMessage) => {
      if (!message.s3_key || !message.content || !message.file) {
        return;
      }

      // Create toaster message for progress bar
      UploadService.activeUploads.unshift({
        contentId: message.content._id,
        s3_key: message.s3_key,
        fileName: message.file.name,
        originalSize: message.file.size,
        total: null,
        loaded: 0,
        percentComplete: '0%',
        failed: false
      });

      // run uploader
      this.awsService
        .uploadNewPublicFile(message.s3_key, message.file)
        .subscribe((s3: S3HeaderResponse) => {
          // don't use forkJoin so that the content item
          // retrieved is the retrieved after the upload completes
          if (message.content['doc_type'] === 'content-item') {
            this.contentLibraryService
              .getContentItem(message.content._id)
              .subscribe((item: ContentItem) => {
                this.setS3Variables(item, message.s3_key, s3);
                this.contentLibraryService
                  .upsertContentItem(item)
                  .subscribe(result => console.log(result));
              });
            return;
          }

          this.contentService.getItem(message.content._id).subscribe((item: Content) => {
            this.setS3Variables(item, message.s3_key, s3);
            this.contentService.updateItem(item).subscribe(result => console.log(result));
          });
        });
    });

    // Monitor file upload status
    progressService.uploadProgress.subscribe((e: IUploadProgressEvent) => {
      // upload progress is not a standard ng event, so we need to invoke tpl zone compilation
      ngZone.run(() => {
        const activeUpload = this.findMatchingActiveUpload(e, UploadService.activeUploads);

        // No match found so don't update anything
        if (!activeUpload) {
          return;
        }

        if (!activeUpload.total) {
          activeUpload.total = e.total;
        }

        activeUpload.loaded = e.loaded;

        activeUpload.percentComplete = `${((e.loaded / e.total) * 100).toFixed(2)}%`;
      });
    });
  }

  findMatchingActiveUpload(
    event: IUploadProgressEvent,
    activeUploads: IActiveUpload[]
  ): IActiveUpload {
    // Find all the active uploads that have total equal to the event total
    // choose the one where event.loaded - loaded is the smallest but greater than zero
    const matchingTotals = activeUploads.filter(
      (item: IActiveUpload) => item.total === event.total && item.loaded < event.loaded
    );
    if (matchingTotals.length > 0) {
      matchingTotals.sort((a: IActiveUpload, b: IActiveUpload): number => b.loaded - a.loaded);
      return matchingTotals[0];
    }

    // If no active upload has a matching total, get all the active uploads with null total
    // choose the one where event.total - originalSize is smallest but greater than zero
    const uploads = activeUploads.filter(
      (item: IActiveUpload) => item.total === null && item.originalSize < event.total
    );
    if (uploads.length > 0) {
      uploads.sort((a: IActiveUpload, b: IActiveUpload): number => b.originalSize - a.originalSize);
      return uploads[0];
    }

    // No match found
    return null;
  }

  getActiveUploads(): IActiveUpload[] {
    return UploadService.activeUploads;
  }

  clearCompleted() {
    UploadService.activeUploads = UploadService.activeUploads.filter(
      item => !!item.total && item.loaded < item.total
    );
  }

  private setS3Variables(item: Content | CLI.IContentItem, s3_key: string, s3: S3HeaderResponse) {
    item.s3_key = s3_key;
    item.s3_etag = (s3.etag || '').replace(/"/g, '');
  }
}
