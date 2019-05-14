import { LayoutComponent } from '../layout/layout.component';

import { AuthGuard } from '../core/guard/auth-guard';
import { CompleteInviteComponent } from './pages/complete-invite/complete-invite.component';
import { DeniedComponent } from './pages/denied/denied.component';
import { Error404Component } from './pages/error404/error404.component';
import { Error500Component } from './pages/error500/error500.component';
import { LoginComponent } from './pages/login/login.component';
import { PasswordResetComponent } from './pages/password-reset/password-reset.component';
import { RecoverComponent } from './pages/recover/recover.component';
import { BuildNumberComponent } from './pages/build-number/build-number.component';


/**
 *  Add Guards To Routes
 *
 *  To protect routes, we need to add guards to the route. This is done by setting a
 *  routes 'canActivate' property to a value like '[ RoleGuard ]'. We have 3 different
 *  guards available. The are:
 *    - AuthGuard: checks for user authentication
 *    - RoleGuard: checks AuthGuard, then make sure current user has correct permissions
 *    - AccountGuard: check Auth and RoleGuard, then make sure current user is assigned
 *        to correct account or facility
 *
 *  NOTE: Even though the 'canAcitvate' property accepts an array of guards, Angular2
 *  does not properly wait for observables in those listed first to finish so instead,
 *  we need to call one guard, and call canActivate for parent guards in that guard.
 *    Ex: [ AuthGuard, RoleGuard ] will not work as expected. Instead, use [ RoleGuard ]
 *        as RoleGuard is setup to check AuthGuard
 *
 *  ACCOUNT GUARD
 *  To Use: import AccountGuard class and set 'canActivate: [ AccountGuard ]'
 *  @see 'core/guard/account-guard.ts' for more documentation on this guard.
 *
 *  ROLE GUARD
 *  To Use: import RoleGuard class and set 'canActivate: [ RoleGuard ]'
 *  @see 'core/guard/role-guard.ts' for more documentation on this guard.
 *
 *  AUTH GUARD
 *  To Use: import AuthGuard and set 'canActivate: [ AuthGaurd ]'
 *  @see 'core/guard/auth-guard.ts' for more documentation on this guard.
 */

/**
 *  Notes On Lazy Loaded Routes
 *
 *  canActivate settings on parent modules (like LayoutComponent) do not filter down to children
 *  components/routes. Each route needs to have a guard assigned to it to prevent access. Therefore,
 *  please update routes defined on each lazy loaded module to properly assign guards for those urls
 */

/**
 *  Notes on defining roles and route guards
 *
 *  Originally, we had a static function in a service that would check for a roles property
 *  in each routes data object and assign route guards as needed, and it worked great in
 *  development, but when built with AOT, would silently fail to work. Attempted to convert
 *  from a service/static function, to a generic function, but always got "ERROR in Error
 *  encountered resolving symbol values statically." errors. Best I can tell, routes cannot be
 *  dynamic in any way for AOT.
 *  @see: https://github.com/angular/angular-cli/issues/5909#issuecomment-299204117
 */

export const routes = [

    // Lazy-loaded routes
    {
        path: '',
        component: LayoutComponent,
        canActivate: [ AuthGuard ],
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', loadChildren: './home/home.module#HomeModule' },

            // --- iN2L Modules ---
            { path: 'account', data: { breadcrumb: 'Account' }, loadChildren: './account/account.module#AccountModule' },
            { path: 'admin', data: { breadcrumb: 'Admin' }, loadChildren: './admin/admin.module#AdminModule' },
            { path: 'content', data: { breadcrumb: 'Content' }, loadChildren: './content/content.module#ContentModule' },
            { path: 'device', data: { breadcrumb: 'Device' }, loadChildren: './device/device.module#DeviceModule' },
            { path: 'invite', data: { breadcrumb: 'Invite' }, loadChildren: './invite/invite.module#InviteModule' },
            { path: 'profile', data: { breadcrumb: 'Profile' }, loadChildren: './profile/profile.module#ProfileModule' },

            // --- Static Pages ---
            { path: 'denied', data: { breadcrumb: 'Restricted Page' }, component: DeniedComponent }
        ]
    },

    // Not lazy-loaded routes
    { path: 'complete-invite/:user_id', component: CompleteInviteComponent },

    { path: 'login', component: LoginComponent },
    { path: 'password-reset', component: PasswordResetComponent },
    { path: 'recover', component: RecoverComponent },
    { path: 'build-number', component: BuildNumberComponent },
    { path: '404', component: Error404Component },
    { path: '500', component: Error500Component },

    // Not found
    { path: '**', redirectTo: '404' }
];
