import * as _ from 'lodash';
import { Injectable } from '@angular/core';

import { AuthenticationService } from '../authentication/authentication.service';
import { IUser, USER_TYPE_IN2L_ADMIN } from '../../model/user/user';
import { UserTypeRoles } from '../../model/role/role';

export interface IPermissionParam {
    keyName: string;
    role: string;
};

export interface IPermissions {
    [key: string]: boolean;
};


@Injectable()
export class RoleService {

    constructor(
        private authenticationService: AuthenticationService
    ) { }

    /**
     * Accepts a single role or an array of roles
     * If single role, returns true if current user has permission for role, false otherwise
     * If array of roles, return true if user has permission for all roles in the array, false otherwise
     *
     * This function is useful for determining if a user has permisson for one or more roles
     */
    currentUserHasRoles(roles: string[] | string): boolean {
        const currentUser = this.authenticationService.currentUser().getValue();
        return !!currentUser && this.userHasRoles(currentUser, roles);
    }

    /**
     * accpets an array of roles and returns an object where the key is the
     * role string, and the value is a boolean base on if the user has permission
     * for that role
     *
     * This function is useful for looking up multiple roles in one call and returning
     * an IPermissions 'permissions object' that can be used easily in views
     *
     * Ex:
     *   in component: this.permissions = this.roleService.currentUserPermissionsObject( ** )
     *   in view: *ngIf="permissions.keyName"
     */
    currentUserPermissionsObject( permissionParams: IPermissionParam[] = [] ): IPermissions {
        const permissions = <IPermissions> {};

        permissionParams.forEach(param => {
            permissions[ param.keyName ] = this.currentUserHasRoles( param.role );
        });

        return permissions;
    }

    userHasRoles(user: IUser, roles: string[] | string) {
        if ( !Array.isArray(roles) ) {
            roles = [ roles ];
        }

        // if the route (or roles array) does not have any defined roles, always return true
        // also, if the user is an in2l-admin user, always return true, they have access to all routes
        if ( !roles || user.type === USER_TYPE_IN2L_ADMIN ) {
            return true;
        }

        const userRoles = UserTypeRoles[ user.type ];

        return _.every( roles, role => userRoles.indexOf(role) !== -1 );
    }
}
