import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/throw';

import { Angular2TokenService } from 'angular2-token';

import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { environment } from '../../../environments/environment';
import { IUser, USER_STATUS_ACTIVE } from '../../model/user/user';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { UserService } from '../../core/user/user.service';
import { UserLoggedInMessage, UserLoggedOutMessage } from '../ui-event-service/ui-user-logged-in';
import { UnauthorizedMessage } from '../ui-event-service/ui-unauthorized';
import { SyncGatewayService } from '../sync-gateway/sync-gateway.service';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';

@Injectable()
export class AuthenticationService {
  private loggedInUser: BehaviorSubject<IUser> = new BehaviorSubject(null);
  private userLoadedAndAuthenticatedObservable: Observable<IUser>;

  constructor(
    private syncGatewayService: SyncGatewayService,
    private tokenService: Angular2TokenService,
    private uiEventService: UiEventService,
    private userService: UserService
  ) {
    this.tokenService.init({
      apiBase: environment.portal.apiURL,
      resetPasswordCallback: `${window.location.protocol}//${window.location.host}/password-reset`,
      signInRedirect: 'login',
      signInStoredUrlStorageKey: 'olympusLoginRedirect',
      signOutFailedValidate: false
    });
  }

  userLoggedIn() {
    return this.tokenService.userSignedIn();
  }

  currentUser(): BehaviorSubject<IUser> {
    return this.loggedInUser;
  }

  validateUser(): Observable<string> {
    return this.tokenService.validateToken().mergeMap((res: Response) => {
      return Observable.of(
        res.status === 200 && res.json().success ? this.tokenService.currentAuthData.uid : null
      );
    });
  }

  // use this function when you don't know if a user has been fully loaded yet
  // otherwise, you should use currentUser()
  userLoadedAndAuthenticated(): Observable<IUser> {
    const user = this.currentUser().value;
    if (user && user.email === this.tokenService.currentAuthData.uid) {
      this.syncGatewayService.setCurrentUserEmail(this.currentUser().value.email);
      return Observable.of(this.currentUser().value);
    }

    if (this.userLoadedAndAuthenticatedObservable) {
      return this.userLoadedAndAuthenticatedObservable;
    }

    this.userLoadedAndAuthenticatedObservable = this.validateUser()
      .mergeMap((email: string) => {
        if (email) {
          // user has a valid token, but needs to load user profile
          return this.loadUserByEmail(email).flatMap((result: IUser) => {
            this.nextLoggedInUser(result);
            this.userLoadedAndAuthenticatedObservable = null;
            return Observable.of(result);
          });
        }

        this.userLoadedAndAuthenticatedObservable = null;
        return Observable.of(null);
      })
      .catch(error => {
        console.log(error);
        this.userLoadedAndAuthenticatedObservable = null;
        return Observable.of(null);
      })
      .share();

    return this.userLoadedAndAuthenticatedObservable;
  }

  // reload user profile, need after profile update to reload cached currentUser values
  refreshCurrentUser(): Observable<IUser> {
    if (!this.loggedInUser || !this.loggedInUser.value) {
      return Observable.of(null);
    }
    const currentUser = this.loggedInUser.value;
    return this.userService.getUser(currentUser._id).mergeMap((user: IUser) => {
      this.uiEventService.dispatch(new UserLoggedInMessage());

      // update loggedInUser subject and return newly loaded user result
      this.nextLoggedInUser(user);
      return Observable.of(user);
    });
  }

  signOut() {
    if (this.userLoggedIn()) {
      this.tokenService.signOut().subscribe(
        (result: Response) => {
          this.nextLoggedInUser(null);
          const data = result && result.json() ? result.json().data : {};
          return Observable.of(data);
        },
        error => {
          console.log('SignOut error: ' + error);
          this.nextLoggedInUser(null);
          return Observable.of(false);
        }
      );
    }

    this.uiEventService.dispatch(new ClearCacheMessage());

    return Observable.of(false);
  }

  signIn(userData: {
    email: string;
    password: string;
    newUser?: boolean;
  }): Observable<BehaviorSubject<IUser>> {
    return this.tokenService
      .signIn({ email: userData.email, password: userData.password })
      .flatMap((result: Response) => {
        const authData = result && result.json() ? result.json().data : {};

        if (authData && authData.user_id && authData.email) {
          this.syncGatewayService.setCurrentUserEmail(authData.email);
          return this.loadUserById(authData.user_id);
        }

        return Observable.throw('We were unable to find the user profile for this user.');
      })
      .flatMap((bsUser: BehaviorSubject<IUser>) => {
        const user = bsUser.getValue();
        if (!userData.newUser && user && user.status !== USER_STATUS_ACTIVE) {
          this.tokenService.signOut();
          return Observable.throw('Your account is not active.');
        }

        this.uiEventService.dispatch(new UserLoggedInMessage());

        return Observable.of(bsUser);
      })
      .catch(error => {
        return this.handleError(error);
      });
  }

  completeAccount(email: string, password: string, confirm_password: string) {
    return this.tokenService
      .registerAccount({
        email: email,
        password: password,
        passwordConfirmation: confirm_password
      })
      .map((res: Response) => {
        return res && res.json() ? res.json().data : {};
      })
      .catch(error => {
        return this.handleError(error);
      });
  }

  resetPassword(email: string) {
    return this.tokenService
      .resetPassword({ email })
      .flatMap((response: Response) => {
        return Observable.of(response.json());
      })
      .catch(error => {
        if (error instanceof Response) {
          const errorResult = error.json();

          if (error.status === 404 && errorResult.errors && Array.isArray(errorResult.errors)) {
            return Observable.throw(errorResult.errors[0]);
          }

          return Observable.throw(errorResult);
        }

        return Observable.throw(error);
      });
  }

  processResetPasswordError(error): string {
    if (error && error.message) {
      return error.message;
    }

    if (error && error.error) {
      return error.error;
    }

    return error;
  }

  // use this updatePassword method when a user has to verify their current password
  // and supply a new password (with confirmation)
  updatePassword(newPassword: string, newPasswordConfirmation: string, currentPassword: string) {
    return this.tokenService
      .updatePassword({
        passwordCurrent: currentPassword,
        password: newPassword,
        passwordConfirmation: newPasswordConfirmation
      })
      .map((res: Response) => {
        return res && res.json() ? res.json().data : {};
      })
      .catch(error => {
        return this.handleError(error);
      });
  }

  // use this updatePasswordWithResetToken when a user is working through the reset password
  // flow. You should have a valid reset token and the new password for the user
  updatePasswordWithResetToken(
    newPassword: string,
    newPasswordConfirmation: string,
    resetPasswordToken: string
  ) {
    return this.tokenService
      .updatePassword({
        password: newPassword,
        passwordConfirmation: newPasswordConfirmation,
        resetPasswordToken: resetPasswordToken,
        passwordCurrent: null // tokenService UpdatePasswordData interface requires (not needed for token reset)
      })
      .map((res: Response) => {
        return res && res.json() ? res.json().data : {};
      })
      .catch(error => {
        return this.handleError(error);
      });
  }

  // --- update couchbase document username helper ---

  getCurrentUserDocumentChangedByValue() {
    if (this.loggedInUser && this.loggedInUser.getValue() && this.loggedInUser.getValue().email) {
      return this.loggedInUser.getValue().email;
    }

    return '';
  }

  getTokenService(): Angular2TokenService {
    return this.tokenService;
  }

  private loadUserById(userId: string): Observable<BehaviorSubject<IUser>> {
    return this.userService.getUser(userId).flatMap((user: IUser) => {
      this.nextLoggedInUser(user);

      return Observable.of(this.loggedInUser);
    });
  }

  private loadUserByEmail(email: string): Observable<IUser> {
    this.syncGatewayService.setCurrentUserEmail(email);
    return this.userService.getUserByEmail(email);
  }

  private handleError(error: Response | any) {
    let errMsg: string;

    if (error instanceof Response) {
      const body = error.json() || '';
      switch (error.status) {
        case 401:
        case 404:
          errMsg = body.errors;
          break;
        case 422:
          errMsg = body.errors.full_messages[0];
          break;
        case 500:
          switch (true) {
            case /key already exists in the server/.test(body.exception):
              errMsg = 'Email address already exists. Please try a different one.';
              break;
            default:
              errMsg = 'We could not complete this action because of a server error.';
              break;
          }
          break;
        default:
          errMsg = 'We could not complete this action because of an unknown error.';
          break;
      }
    } else {
      errMsg = error.message ? error.message : error.toString();
    }

    return Observable.throw(errMsg);
  }

  private nextLoggedInUser(user: IUser) {
    if (this.loggedInUser) {
      this.loggedInUser.next(user);
      return;
    }

    this.loggedInUser = new BehaviorSubject(user);
  }
}
