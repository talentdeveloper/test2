import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
const screenfull = require('screenfull');
const browser = require('jquery.browser');
declare var $: any;

import { AuthenticationService } from '../../core/authentication/authentication.service';
import { UiEventService } from '../../core/ui-event-service/ui-event-service';
import { LoadingMessage } from '../../core/ui-event-service/ui-loading';
import { SettingsService } from '../../core/settings/settings.service';


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    menuItems = []; // for horizontal layout
    loading = false;

    @ViewChild('fsbutton') fsbutton;  // the fullscreen button

    constructor(
        private authenticationService: AuthenticationService,
        private settings: SettingsService,
        private router: Router,
        private uiEventService: UiEventService
    ) { }

    ngOnInit() {
        if (browser.msie) { // Not supported under IE
            this.fsbutton.nativeElement.style.display = 'none';
        }

        this.uiEventService.subscribe(LoadingMessage, (loading) => {
            this.loading = loading.enabled;
        });
    }

    toggleCollapsedSideabar() {
        this.settings.layout.isCollapsed = !this.settings.layout.isCollapsed;
    }

    isCollapsedText() {
        return this.settings.layout.isCollapsedText;
    }

    toggleFullScreen(event) {

        if (screenfull.enabled) {
            screenfull.toggle();
        }
        // Switch icon indicator
        const el = $(this.fsbutton.nativeElement);
        if (screenfull.isFullscreen) {
            el.children('em').removeClass('fa-expand').addClass('fa-compress');
        }
        else {
            el.children('em').removeClass('fa-compress').addClass('fa-expand');
        }
    }

    logout() {
        this.authenticationService.signOut().subscribe(
            result => this.navigateToLogin(),
            error => this.navigateToLogin()
        );
    }

    private navigateToLogin() {
        this.router.navigate([ '/login' ]);
    }
}
