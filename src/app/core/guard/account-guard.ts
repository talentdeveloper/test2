import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthenticationService } from '../authentication/authentication.service';
import {
  USER_TYPE_IN2L_ADMIN,
  USER_TYPE_IN2L,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN
} from '../../model/user/user';
import { RoleGuard } from './role-guard';


/*
 *  ACCOUNT GUARD
 *  To Use: import AccountGuard class and set 'canActivate: [ AccountGuard ]'
 *
 *  First checks AuthGuard to make sure user is authenticated, then checks RoleGuard
 *  to check current user's allowed roles against any roles defined on the route. If
 *  both of those guard's check out, the url is then checked for /account/:id and
 *  /facility/:facility_id segments of the url and make sure the user is assigned to
 *  the account/facility for that url.
 */

@Injectable()
export class AccountGuard implements CanActivate {

  constructor(
    private authenticationService: AuthenticationService,
    private roleGuard: RoleGuard,
    private router: Router
  ) { }

  /**
   * CanActivate Interface Functions
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const routeRoles = route.data['roles'];

    // call role guard first to make sure permissions are in place first
    // note, role guard calls AuthGuard so we don't need to do that again here
    return this.roleGuard.canActivate(route, state)
      .flatMap(roleResult => {
        if (!roleResult) {
          return Observable.of( false );
        }

        const currentUser = this.authenticationService.currentUser().getValue();

        // for in2l-admin and in2l users, return true as these users are not limited to
        // specific accounts or facilities, and reaching this point means AuthGuard and
        // RoleGuard requirements have been met

        if ( _.includes( [USER_TYPE_IN2L_ADMIN, USER_TYPE_IN2L], currentUser.type ) ) {
          return Observable.of( true );
        }

        // now check that links are limited to an account (for account users)
        // or to a facility for facility users
        let hasAccessToRoute = false;

        if ( currentUser.type === USER_TYPE_ACCOUNT_ADMIN ) {

          // check route for an account id matching users assigned account
          // on urls that start with '/account/' only
          if ( state.url.match(/^\/account\//) ) {
            hasAccessToRoute = ( route.params['id'] === currentUser.account_id );
          } else {
            hasAccessToRoute = true;
          }

        } else if (currentUser.type === USER_TYPE_FACILITY_ADMIN) {

          // check route for a facility id matching users assigned facility
          // on urls that start with '/account/' and have a `/facility/` in the url
          if ( state.url.match(/^\/account\//) && state.url.match(/\/facility\//) ) {
            hasAccessToRoute = (
              ( route.params['id'] === currentUser.account_id ) &&
              ( currentUser.facility_ids.includes(route.params['facility_id']) )
            );
          } else {
            hasAccessToRoute = true;
          }

        } else {
          // unexpect user type, return false
          hasAccessToRoute = false;
        }

        if (!hasAccessToRoute) {
          this.router.navigate(['/denied']);
        }

        return Observable.of( hasAccessToRoute );
      });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|Promise<boolean>|boolean {
    return this.canActivate(route, state);
  }
}
