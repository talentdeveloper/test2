import { Directive, ElementRef, Input, OnChanges, SimpleChange } from '@angular/core';

import { FileUtilityService } from '../../../core/file/file-utility.service';
import { PortalAPIService } from '../../../core/portal-api/portal-api.service';
import { SyncGatewayService } from '../../../core/sync-gateway/sync-gateway.service';

@Directive({
  selector: '[appAttachmentSrc]'
})
export class AttachmentSrcDirective implements OnChanges {
  @Input()
  appAttachmentSrc: string;

  constructor(
    private elementRef: ElementRef,
    private portalAPIService: PortalAPIService,
    private syncGatewayService: SyncGatewayService
  ) {}

  ngOnChanges(changes): void {
    if (this.elementRef.nativeElement.nodeName !== 'IMG') {
      return;
    }

    if (changes['appAttachmentSrc']) {
      const change = <SimpleChange>changes['appAttachmentSrc'];

      if (change.currentValue) {
        this.loadImage(change.currentValue);
      }
    }
  }

  private loadImage(url: string): void {
    // if image starts with '/assets/', its a image path relative to the web app
    //   this is the case with fallback/default images
    //   otherwise, we assume its a sync gateway attachment
    if (/^\/assets\//.test(url) || url.startsWith('data:')) {
      this.elementRef.nativeElement.setAttribute('src', url);
    } else {
      this.portalAPIService
        .sendSyncGatewayGetAttachmentRequest(url)
        .flatMap((imageBlob: Blob) => {
          // rec blob, convert to dataURI
          return FileUtilityService.convertBlobToDataURI(imageBlob);
        })
        .subscribe(
          (imageDataURI: string) => {
            if (imageDataURI.length) {
              this.elementRef.nativeElement.setAttribute('src', imageDataURI);
            }
          },
          error => {
            console.warn('Could not convert image to dataURI', error);
          }
        );
    }
  }
}
