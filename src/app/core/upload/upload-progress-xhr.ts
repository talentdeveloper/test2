import { Injectable } from '@angular/core';
import { BrowserXhr } from '@angular/http';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ProgressService {
  uploadProgress: Subject<any> = new Subject();
}

@Injectable()
export class UploadProgressXhr extends BrowserXhr {
  constructor(protected service: ProgressService) {
    super();
  }

  build(): any {
    const xhr = super.build();

    xhr.upload.onprogress = event => {
      this.service.uploadProgress.next(event);
    };

    return <any>xhr;
  }
}
