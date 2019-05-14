import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import {
  ContentLibraryItemFormComponent,
  ContentLibraryItemComponent,
  ContentLibraryListComponent
} from './content-library';

@NgModule({
  imports: [SharedModule],
  providers: [],
  declarations: [
    ContentLibraryItemFormComponent,
    ContentLibraryItemComponent,
    ContentLibraryListComponent
  ],
  exports: [
    ContentLibraryItemFormComponent,
    ContentLibraryItemComponent,
    ContentLibraryListComponent
  ]
})
export class PresentationModule {}
