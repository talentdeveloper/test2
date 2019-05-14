import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { IUser, USER_STATUS_ACTIVE, USER_STATUS_INVITED } from '../../model/user/user';
import { PortalAPIService } from '../portal-api/portal-api.service';
import { UserService } from '../user/user.service';


@Injectable()
export class InviteService {

    redirectURL: string;

    constructor(
        private portalAPIService: PortalAPIService,
        private userService: UserService
    ) { }

    createInvite(user_profile_id: string, email: string) {
        return this.portalAPIService.sendInvite({
            invite: {
                email: email,
                id: user_profile_id
            },
            redirect_url: this.getRedirectURL(user_profile_id)
        });
    }

    deleteInvite(user: IUser): Observable<boolean> {
        // remove rails invite record, then delete user_profile_record
        return this.portalAPIService.deleteInvite(user)
            .flatMap( deleteResult => this.userService.deleteUser(user) )
            .catch((error: Response) => {
                // if an invite is missing from the portal api, this could mean a couple things
                //   1. on create, an invite was not succesfully added to rails (rails was down)
                //   2. the invite has been converted to a user record between page load and
                //      delete button click, now a user, not an invite
                if (error.status === 404) {
                    // reload user to check for status change
                    return this.userService.getUser( user._id )
                        .flatMap((updatedUser: IUser) => {
                            // if user status is still invited, delete user_profile_data record (case 1)
                            if (updatedUser.status === USER_STATUS_INVITED) {
                                return this.userService.deleteUser(user);
                            }

                            // user is now active, don't delete as invite (case 2)
                            return Observable.throw(`Could not delete this invite because ${user.email} is now an active user`);
                        });
                }

                // not a 404 status, lets just pass the error through
                return Observable.throw(error);
            });
    }

    private getRedirectURL(user_profile_id: string): string {
        let host = window.location.protocol + '//' + window.location.hostname;

        // uri.port != 80 and uri.port != 443
        if (window.location.port && window.location.port !== '80' && window.location.port !== '443') {
            host += ':' + window.location.port;
        }

        return host + `/complete-invite/${user_profile_id}`;
    }
}
