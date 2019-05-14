import { NgModule } from '@angular/core';

import { LayoutComponent } from './layout.component';
import { SidebarService } from './sidebar/sidebar.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SidebarLinkComponent } from './sidebar/sidebar-link/sidebar-link.component';
import { SidebarGroupComponent } from './sidebar/sidebar-group/sidebar-group.component';
import { SidebarAccountsGroupComponent } from './sidebar/sidebar-accounts-group/sidebar-accounts-group.component';
import { SidebarFacilitiesGroupComponent } from './sidebar/sidebar-facilities-group/sidebar-facilities-group.component';
import { HeaderComponent } from './header/header.component';
import { NavsearchComponent } from './header/navsearch/navsearch.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { OffsidebarComponent } from './offsidebar/offsidebar.component';
import { UserblockComponent } from './sidebar/userblock/userblock.component';
import { UserblockService } from './sidebar/userblock/userblock.service';
import { FooterComponent } from './footer/footer.component';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';

import { LayoutNotificationComponent } from './layout-notification/layout-notification.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [SharedModule],
  providers: [UserblockService, SidebarService],
  declarations: [
    UploadProgressComponent,
    LayoutComponent,
    SidebarComponent,
    SidebarLinkComponent,
    SidebarGroupComponent,
    SidebarAccountsGroupComponent,
    SidebarFacilitiesGroupComponent,
    UserblockComponent,
    HeaderComponent,
    NavsearchComponent,
    LayoutNotificationComponent,
    BreadcrumbComponent,
    OffsidebarComponent,
    FooterComponent
  ],
  exports: [
    LayoutComponent,
    SidebarComponent,
    SidebarLinkComponent,
    SidebarGroupComponent,
    SidebarAccountsGroupComponent,
    SidebarFacilitiesGroupComponent,
    UserblockComponent,
    HeaderComponent,
    NavsearchComponent,
    LayoutNotificationComponent,
    BreadcrumbComponent,
    OffsidebarComponent,
    FooterComponent
  ]
})
export class LayoutModule {}
