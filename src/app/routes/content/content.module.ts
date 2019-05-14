import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TreeModule } from 'angular2-tree-component';
import { TagInputModule } from 'ng2-tag-input';

import { AddContainerComponent } from './add-container/add-container.component';
import { AddContentComponent } from './add-content/add-content.component';
import { SharedModule } from '../../shared/shared.module';
import { CancelPromptComponent } from './cancel-prompt/cancel-prompt.component';
import { ContentCatalogComponent } from './content-catalog/content-catalog.component';
import { ContentDashboardComponent } from './content-dashboard/content-dashboard.component';
import { ContentFinderComponent } from './content-finder/content-finder.component';
import { ContentFinderOptionsComponent } from './content-finder-options/content-finder-options.component';
import { ContainerFormComponent } from './shared/container-form/container-form.component';
import { ContentFormComponent } from './shared/content-form/content-form.component';
import { ContentStatusComponent } from './shared/content-status/content-status.component';
import { EditContainerComponent } from './edit-container/edit-container.component';
import { EditContentComponent } from './edit-content/edit-content.component';
import { ROLE_ADD_CONTENT, ROLE_EDIT_CONTENT, ROLE_VIEW_CONTENT } from '../../model/role/role';
import { RoleGuard } from '../../core/guard/role-guard';
import { ViewContentComponent } from './view-content/view-content.component';
import { ViewContainerComponent } from './view-container/view-container.component';
import { DeleteContentComponent } from './delete-content/delete-content.component';
import { DeleteContainerComponent } from './delete-container/delete-container.component';
import { DateRangeValidator } from './shared/DateRangeValidator';

import { ContentLibraryFolderContainerComponent } from './content-library-folder/content-library-folder-container.component';
import { ContentLibraryAddItemContainerComponent } from './content-library-add-item/content-library-add-item-container.component';
import { ContentLibraryEditItemContainerComponent } from './content-library-edit-item/content-library-edit-item-container.component';
import { ContentLibraryItemContainerComponent } from './content-library-item/content-library-item-container.component';
import { ContentLayoutComponent } from './content-layout/content-layout.component';
import { PresentationModule } from '../../presentation/presentation.module';

const routes: Routes = [
  { path: 'library', redirectTo: 'library/folder/~', pathMatch: 'full' },
  { path: 'library/folder', redirectTo: 'library/folder/~', pathMatch: 'full' },
  {
    path: 'library/folder/:path',
    component: ContentLibraryFolderContainerComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Content Library', url: '' }],
      roles: [ROLE_VIEW_CONTENT]
    }
  },
  {
    path: 'library/folder/:path/additem',
    component: ContentLibraryAddItemContainerComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Content Library', url: '' }],
      roles: [ROLE_ADD_CONTENT]
    }
  },
  {
    path: 'library/folder/:path/item/:contentId',
    component: ContentLibraryItemContainerComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Content Library', url: '' }],
      roles: [ROLE_VIEW_CONTENT]
    }
  },
  {
    path: 'library/folder/:path/item/:contentId/edit',
    component: ContentLibraryEditItemContainerComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Content Library', url: '' }],
      roles: [ROLE_EDIT_CONTENT]
    }
  },
  {
    path: 'layout',
    component: ContentLayoutComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Content Layout', url: '' }],
      roles: [ROLE_VIEW_CONTENT]
    }
  },
  {
    path: 'catalog',
    component: ContentCatalogComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Content Catalog', url: '' }],
      roles: [ROLE_VIEW_CONTENT]
    },
    children: [
      {
        path: '',
        outlet: 'item',
        component: ContentDashboardComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Dashboard', url: '' }],
          roles: [ROLE_VIEW_CONTENT]
        }
      },
      {
        path: 'container/:parent_id/add/container',
        outlet: 'item',
        component: AddContainerComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Node', url: '' }],
          roles: [ROLE_ADD_CONTENT]
        }
      },
      {
        path: 'container/:parent_id/add/content',
        outlet: 'item',
        component: AddContentComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Node', url: '' }],
          roles: [ROLE_ADD_CONTENT]
        }
      },
      {
        path: 'container/:id/edit',
        outlet: 'item',
        component: EditContainerComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Node', url: '' }],
          roles: [ROLE_EDIT_CONTENT]
        }
      },
      {
        path: 'content/:id/edit',
        outlet: 'item',
        component: EditContentComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Node', url: '' }],
          roles: [ROLE_EDIT_CONTENT]
        }
      },
      {
        path: 'container/:id',
        outlet: 'item',
        component: ViewContainerComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Node', url: '' }],
          roles: [ROLE_VIEW_CONTENT]
        }
      },
      {
        path: 'content/:id',
        outlet: 'item',
        component: ViewContentComponent,
        canActivate: [RoleGuard],
        data: {
          breadcrumbs: [{ label: 'Content Node', url: '' }],
          roles: [ROLE_VIEW_CONTENT]
        }
      }
    ]
  }
];

@NgModule({
  imports: [
    SharedModule,
    PresentationModule,
    RouterModule.forChild(routes),
    TagInputModule,
    TreeModule
  ],
  declarations: [
    AddContainerComponent,
    AddContentComponent,
    CancelPromptComponent,
    ContentCatalogComponent,
    ContentDashboardComponent,
    ContentFinderComponent,
    ContentFinderOptionsComponent,
    ContainerFormComponent,
    ContentFormComponent,
    ContentStatusComponent,
    EditContainerComponent,
    EditContentComponent,
    ViewContentComponent,
    ViewContainerComponent,
    DeleteContentComponent,
    DeleteContainerComponent,
    DateRangeValidator,
    ContentLibraryFolderContainerComponent,
    ContentLibraryAddItemContainerComponent,
    ContentLibraryEditItemContainerComponent,
    ContentLibraryItemContainerComponent,
    ContentLayoutComponent
  ],
  exports: [RouterModule]
})
export class ContentModule {}
