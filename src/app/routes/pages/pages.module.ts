import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompleteInviteComponent } from './complete-invite/complete-invite.component';
import { SharedModule } from '../../shared/shared.module';
import { DeniedComponent } from './denied/denied.component';
import { LoginComponent } from './login/login.component';
import { RecoverComponent } from './recover/recover.component';
import { Error404Component } from './error404/error404.component';
import { Error500Component } from './error500/error500.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { BuildNumberComponent } from './build-number/build-number.component';

/* Use this routes definition in case you want to make them lazy-loaded */
/*const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'recover', component: RecoverComponent },
    { path: '404', component: Error404Component },
    { path: '500', component: Error500Component },
    { path: 'password-reset', component: PasswordResetComponent },
];*/

@NgModule({
    imports: [
        SharedModule,
        // RouterModule.forChild(routes)
    ],
    declarations: [
        CompleteInviteComponent,
        DeniedComponent,
        LoginComponent,
        RecoverComponent,
        Error404Component,
        Error500Component,
        PasswordResetComponent,
        BuildNumberComponent
    ],
    exports: [
        CompleteInviteComponent,
        DeniedComponent,
        RouterModule,
        LoginComponent,
        RecoverComponent,
        Error404Component,
        Error500Component,
        PasswordResetComponent,
        BuildNumberComponent
    ]
})
export class PagesModule { }
