import { Component, HostBinding, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import 'rxjs/add/operator/distinctUntilChanged';

declare var $: any;
declare var ga: Function;

import { environment } from '../environments/environment';
import { AuthenticationService } from './core/authentication/authentication.service';
import { SettingsService } from './core/settings/settings.service';
import { AccountService } from './core/account/account.service';
import { ResidentService } from './core/resident/resident.service';
import { DeviceService } from './core/device/device.service';
import { FacilityService } from './core/facility/facility.service';
import { UiEventService } from './core/ui-event-service/ui-event-service';
import {
  UserLoggedInMessage,
  UserLoggedOutMessage
} from './core/ui-event-service/ui-user-logged-in';
import { SyncGatewayService } from './core/sync-gateway/sync-gateway.service';
import { ContentService } from './core/content/content.service';
import { UnauthorizedMessage } from './core/ui-event-service/ui-unauthorized';
import { IUser } from './model/user/user';
import { Behavior } from 'ng2-select';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @HostBinding('class.layout-fixed')
  get isFixed() {
    return this.settings.layout.isFixed;
  }
  @HostBinding('class.aside-collapsed')
  get isCollapsed() {
    return this.settings.layout.isCollapsed;
  }
  @HostBinding('class.layout-boxed')
  get isBoxed() {
    return this.settings.layout.isBoxed;
  }
  @HostBinding('class.layout-fs')
  get useFullLayout() {
    return this.settings.layout.useFullLayout;
  }
  @HostBinding('class.hidden-footer')
  get hiddenFooter() {
    return this.settings.layout.hiddenFooter;
  }
  @HostBinding('class.layout-h')
  get horizontal() {
    return this.settings.layout.horizontal;
  }
  @HostBinding('class.aside-float')
  get isFloat() {
    return this.settings.layout.isFloat;
  }
  @HostBinding('class.offsidebar-open')
  get offsidebarOpen() {
    return this.settings.layout.offsidebarOpen;
  }
  @HostBinding('class.aside-toggled')
  get asideToggled() {
    return this.settings.layout.asideToggled;
  }
  @HostBinding('class.aside-collapsed-text')
  get isCollapsedText() {
    return this.settings.layout.isCollapsedText;
  }

  private unauthorizedWatcher = new BehaviorSubject(null);

  constructor(
    private authenticationService: AuthenticationService,
    private uiEventService: UiEventService,
    private accountService: AccountService,
    private facilityservice: FacilityService,
    private deviceService: DeviceService,
    private residentService: ResidentService,
    private contentService: ContentService,
    private syncGatewayService: SyncGatewayService,
    public router: Router,
    public settings: SettingsService
  ) {
    // set google analyics ua id based on environment
    ga('create', environment.google.analytics.ua, 'auto');

    router.events
      .distinctUntilChanged((previous: any, current: any) => {
        if (current instanceof NavigationEnd) {
          return previous.url === current.url;
        }
        return true;
      })
      .subscribe((x: any) => {
        ga('send', 'pageview', x.url);
      });
  }

  ngOnInit() {
    $(document).on('click', '[href="#"]', e => e.preventDefault());

    this.authenticationService.currentUser().subscribe((user: IUser) => {
      if (user) {
        this.syncGatewayService.setCurrentUserEmail(user.email);
        this.preloadData(user);
      }
    });

    // this.authenticationService.userLoadedAndAuthenticated().subscribe(value => {
    //   if (value) {
    //     this.preloadData();
    //     return;
    //   }
    // });

    // this.uiEventService.subscribe(UserLoggedInMessage, () => this.preloadData(this.authenticationService.currentUser().));

    this.unauthorizedWatcher.debounceTime(200).subscribe((value: string) => {
      if (!value) {
        return;
      }
      this.syncGatewayService.removeCurrentUser();
      // this.authenticationService.signOut().mergeMap(() => this.router.navigateByUrl('/login'));
      this.router.navigateByUrl('/login');
    });

    this.uiEventService.subscribe(UnauthorizedMessage, () => {
      this.unauthorizedWatcher.next('unauthorized');
    });
  }

  private preloadData(user: IUser) {
    if (!user) {
      return;
    }

    this.syncGatewayService.setCurrentUserEmail(user.email);

    if (['in2l-admin', 'account-admin', 'facility-admin'].includes(user.type)) {
      this.accountService.getAccounts();
      this.facilityservice.getAllFacilities();
      this.deviceService.getAllDevices();
      this.residentService.getAllResidents();
      return;
    }

    if (user.type === 'in2l') {
      this.contentService.getAllContent();
      return;
    }
  }
}
