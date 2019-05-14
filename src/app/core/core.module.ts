import { NgModule, Optional, SkipSelf } from '@angular/core';
import { Angular2TokenService } from 'angular2-token';

import { AccountGuard } from './guard/account-guard';
import { AccountService } from './account/account.service';
import { AttachmentFactoryService } from './attachment/attachment-factory.service';
import { AuthenticationService } from './authentication/authentication.service';
import { AuthGuard } from './guard/auth-guard';
import { AwsService } from './aws/aws.service';
import { BreadcrumbService } from './breadcrumb/breadcrumb.service';
import { DashboardApiService } from './dashboard-api/dashboard-api.service';
import { ContentService } from './content/content.service';
import { ContentChangeFeedService } from './content/content-change-feed.service';
import { ContentLibraryService } from './content-library/content-library.service';
import { DashboardService } from './dashboard/dashboard.service';
import { DeviceService } from './device/device.service';
import { FacilityService } from './facility/facility.service';
import { FileUtilityService } from './file/file-utility.service';
import { InviteService } from './invite/invite.service';
import { InputService } from './input/input.service';
import { LoaderService } from './loader/loader.service';
import { PortalAPIService } from './portal-api/portal-api.service';
import { ProgressService } from './upload/upload-progress-xhr';
import { ResidentService } from './resident/resident.service';
import { ResidentFactoryService } from './resident/resident-factory.service';
import { ResidentFormService } from './resident/resident-form.service';
import { RoleGuard } from './guard/role-guard';
import { RoleService } from './role/role.service';
import { SettingsService } from './settings/settings.service';
import { SyncAdminApiService } from './sync-admin-api/sync-admin-api.service';
import { SyncGatewayService } from './sync-gateway/sync-gateway.service';
import { TextMessageService } from './text-message/text-message.service';
import { ThemesService } from './themes/themes.service';
import { TranslatorService } from './translator/translator.service';
import { UserFactoryService } from './user/user-factory.service';
import { UserService } from './user/user.service';
import { MessageService } from './message/message.service';
import { UploadService } from './upload/upload.service';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { UiEventService } from './ui-event-service/ui-event-service';

@NgModule({
  imports: [],
  providers: [
    AccountGuard,
    AccountService,
    Angular2TokenService,
    AttachmentFactoryService,
    AuthenticationService,
    AuthGuard,
    AwsService,
    BreadcrumbService,
    DashboardApiService,
    ContentChangeFeedService,
    ContentLibraryService,
    ContentService,
    DashboardService,
    DeviceService,
    FacilityService,
    FileUtilityService,
    InviteService,
    InputService,
    LoaderService,
    MessageService,
    PortalAPIService,
    ProgressService,
    ResidentService,
    ResidentFactoryService,
    ResidentFormService,
    RoleGuard,
    RoleService,
    SettingsService,
    SyncAdminApiService,
    SyncGatewayService,
    TextMessageService,
    ThemesService,
    TranslatorService,
    UiEventService,
    UserFactoryService,
    UserService,
    UploadService
  ],
  declarations: [],
  exports: []
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
