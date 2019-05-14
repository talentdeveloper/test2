import { Injectable } from '@angular/core';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthGuard } from './auth-guard';
import { RoleService } from '../role/role.service';


/**
 *  ROLE GUARD
 *  To Use: import RoleGuard class and set 'canActivate: [ RoleGuard ]'
 *
 *  If the route does not need to be restricted to a specific account or facility,
 *  but it should be restricted to certain roles, use this guard. Add a 'roles' array
 *  property to the routes data object and define the required roles. You can add multiple
 *  roles. Role constants are defined in 'model/role/role.ts'. Roles are set for each user
 *  type (also in role.ts). All roles in the 'roles' list must exist on the user type to
 *  allow access.
 *
 *  When a user attempts to access a route they do not have roles defined by, the user
 *  will be redirected to the /denied page.
 */

@Injectable()
export class RoleGuard implements CanActivate {

    constructor(
        private authGuard: AuthGuard,
        private roleService: RoleService,
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

        // run auth guard can activate first, then check role logic
        return this.authGuard.canActivate(route, state)
            .flatMap(authResult => {
                if (!authResult) {
                    return Observable.of( false );
                }

                const hasRolesForRoute = this.roleService.currentUserHasRoles( routeRoles );

                if (!hasRolesForRoute) {
                    this.router.navigate(['/denied']);
                }

                return Observable.of( hasRolesForRoute );
            });
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|Promise<boolean>|boolean {
        return this.canActivate(route, state);
    }
}
