import { Injectable } from '@angular/core';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthenticationService } from '../authentication/authentication.service';
import { UiEventService } from '../ui-event-service/ui-event-service';

/**
 *  AUTH GUARD
 *  To Use: import AuthGuard and set 'canActivate: [ AuthGaurd ]'
 *
 *  This should be a default guard for all route requiring user authentication. Simply
 *  prevents access to pages that require authentications users. When a request is made
 *  and a user is not authenticated, this guard will redirect the uer to the login page.
 */

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private uiEventService: UiEventService
  ) {}

  /**
   * CanActivate Interface Functions
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authenticationService.userLoadedAndAuthenticated().flatMap(result => {
      if (!result) {
        this.router.navigateByUrl('/login');
        return Observable.of(false);
      }

      return Observable.of(true);
    });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(route, state);
  }
}
