import { Injectable, ReflectiveInjector } from '@angular/core';
import {
  Http,
  Request,
  RequestOptions,
  RequestMethod,
  Response,
  BaseRequestOptions,
  ResponseOptions,
  BaseResponseOptions,
  ConnectionBackend,
  XHRBackend,
  XSRFStrategy,
  CookieXSRFStrategy,
  BrowserXhr
} from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../environments/environment';

import { UploadFailedMessage } from '../ui-event-service/ui-queue-upload';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { ProgressService, UploadProgressXhr } from '../upload/upload-progress-xhr';

const signedPolicy = environment.bucketPolicy.fields;
export const S3_HOST = environment.bucketPolicy.host;

export interface S3HeaderResponse {
  key: string;
  etag: string;
}

@Injectable()
export class AwsService {
  private http: Http;

  constructor(private uiEventService: UiEventService, private progressService: ProgressService) {
    // we only want to override this specific Http injection, so we'll manually provide it
    const injector = ReflectiveInjector.resolveAndCreate([
      Http,
      { provide: BrowserXhr, useClass: UploadProgressXhr },
      { provide: RequestOptions, useClass: BaseRequestOptions },
      { provide: ResponseOptions, useClass: BaseResponseOptions },
      { provide: ConnectionBackend, useClass: XHRBackend },
      { provide: XSRFStrategy, useFactory: () => new CookieXSRFStrategy() },
      // we need one shared service, so we'll mock a factory then return the shared instance
      { provide: ProgressService, useFactory: () => progressService }
    ]);

    this.http = injector.get(Http);
  }

  getFormInfo(key: string, file: File) {
    const data = new FormData();

    data.append('acl', signedPolicy.acl);
    data.append('Policy', signedPolicy.policy);
    data.append('X-Amz-Signature', signedPolicy['x-amz-signature']);
    data.append('key', key);
    data.append('X-Amz-Credential', signedPolicy['x-amz-credential']);
    data.append('X-Amz-Algorithm', signedPolicy['x-amz-algorithm']);
    data.append('X-Amz-Date', signedPolicy['x-amz-date']);
    data.append('Content-Type', file.type);

    data.append('file', file);

    return data;
  }

  uploadNewPublicFile(key: string, file: File): Observable<S3HeaderResponse> {
    const requestOptions = new Request({
      url: S3_HOST,
      method: RequestMethod.Post,
      body: this.getFormInfo(key, file)
    });

    return this.http
      .request(requestOptions)
      .map(
        (response: Response): S3HeaderResponse => ({
          key,
          etag: response.headers.get('ETag')
        })
      )
      .catch((error: any) => {
        this.uiEventService.dispatch(new UploadFailedMessage(key));
        return Observable.throw(error || 'Server error');
      });
  }
}
