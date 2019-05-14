import { Http } from '@angular/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

@Injectable()
export class ConnectApiBaseService {
  protected connectApiUrl: string;
  protected storageType: 'sessionStorage' | 'localStorage' = 'localStorage';
  private localStorage: Storage = window.localStorage;

  constructor(protected http: Http) {
    this.connectApiUrl = environment.connectApi.url;
  }

  // this returns any because the intellisense does not allow for proper type conversion
  protected getHttpOptions(): any {
    return {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': environment.connectApi.apiKey,
        'access-token': this.localStorage.getItem('accessToken') || '',
        client: this.localStorage.getItem('client') || '',
        expiry: this.localStorage.getItem('expiry') || '',
        uid: this.localStorage.getItem('uid') || '',
        'token-type': this.localStorage.getItem('tokenType') || ''
      }
    };
  }
}
