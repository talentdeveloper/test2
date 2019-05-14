import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SelectModule } from 'ng2-select';
import { Ng2TableModule } from 'ng2-table/ng2-table';

import { TranslateModule } from 'ng2-translate/ng2-translate';
import { ToasterModule } from 'angular2-toaster/angular2-toaster'; // known use in NotificationService
import { TextMaskModule } from 'angular2-text-mask'; // known use in several forms accross site
import { FileUploadModule } from 'ng2-file-upload';
import { ImageCropperModule } from 'ng2-img-cropper'; // known use in resident and profile forms
import { NgPipesModule } from 'ng-pipes';
import { TagInputModule } from 'ng2-tag-input';

import { AccordionModule } from 'ngx-bootstrap/accordion';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { RatingModule } from 'ngx-bootstrap/rating';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { FlotDirective } from './directives/flot/flot.directive';

// tslint:disable-next-line:max-line-length
import { AccountFacilitiesUsageReportComponent } from './components/account-facilities-usage-report/account-facilities-usage-report.component';
import { AttachmentSrcDirective } from './directives/attachment-src/attachment-src.directive';
import { DocumentChangedByComponent } from './components/document-changed-by/document-changed-by.component';
import { ContentUsagePieChartComponent } from './components/content-usage-pie-chart/content-usage-pie-chart.component';
import { ContentUsageReportComponent } from './components/content-usage-report/content-usage-report.component';
import { DrillDownChartComponent } from './components/drill-down-chart/drill-down-chart.component';
import { DrillDownDateSelectorComponent } from './components/drill-down-date-selector/drill-down-date-selector.component';
import { InviteFormComponent } from './components/invite-form/invite-form.component';
import { ImageCropControlComponent } from './components/image-crop-control/image-crop-control.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { PanelTitleComponent } from './components/panel-title/panel-title.component';
import { SortableReportComponent } from './components/sortable-report/sortable-report.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserProfileFormComponent } from './components/user-profile-form/user-profile-form.component';
import { UserTypeSelectComponent } from './components/user-type-select/user-type-select.component';
import { UserViewComponent } from './components/user-view/user-view.component';
import { RichTextEditorComponent } from './rich-text-editor/rich-text-editor.component';

// https://angular.io/styleguide#!#04-10
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FileUploadModule,
    ImageCropperModule,
    NgPipesModule,
    Ng2TableModule,
    TagInputModule,
    TranslateModule,
    TextMaskModule,
    ToasterModule,
    AccordionModule.forRoot(),
    AlertModule.forRoot(),
    ButtonsModule.forRoot(),
    CarouselModule.forRoot(),
    CollapseModule.forRoot(),
    BsDatepickerModule.forRoot(),
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
    RatingModule.forRoot(),
    SelectModule,
    TabsModule.forRoot(),
    TimepickerModule.forRoot(),
    TooltipModule.forRoot(),
    TypeaheadModule.forRoot()
  ],
  declarations: [
    FlotDirective,
    AccountFacilitiesUsageReportComponent,
    AttachmentSrcDirective,
    DocumentChangedByComponent,
    ContentUsagePieChartComponent,
    ContentUsageReportComponent,
    DrillDownChartComponent,
    DrillDownDateSelectorComponent,
    InviteFormComponent,
    ImageCropControlComponent,
    PageTitleComponent,
    PanelTitleComponent,
    RichTextEditorComponent,
    SortableReportComponent,
    UserListComponent,
    UserProfileFormComponent,
    UserTypeSelectComponent,
    UserViewComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FileUploadModule,
    NgPipesModule,
    TextMaskModule,
    TranslateModule,
    RouterModule,
    AccordionModule,
    AlertModule,
    ButtonsModule,
    CarouselModule,
    CollapseModule,
    BsDatepickerModule,
    BsDropdownModule,
    ImageCropperModule,
    ModalModule,
    PaginationModule,
    ProgressbarModule,
    RatingModule,
    TabsModule,
    TagInputModule,
    TimepickerModule,
    TooltipModule,
    TypeaheadModule,
    ToasterModule,
    FlotDirective,
    AccountFacilitiesUsageReportComponent,
    AttachmentSrcDirective,
    DocumentChangedByComponent,
    ContentUsagePieChartComponent,
    ContentUsageReportComponent,
    DrillDownChartComponent,
    DrillDownDateSelectorComponent,
    InviteFormComponent,
    ImageCropControlComponent,
    PageTitleComponent,
    PanelTitleComponent,
    RichTextEditorComponent,
    SortableReportComponent,
    UserListComponent,
    UserProfileFormComponent,
    UserTypeSelectComponent,
    UserViewComponent,
    Ng2TableModule
  ]
})

// https://github.com/ocombe/ng2-translate/issues/209
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule
    };
  }
}
