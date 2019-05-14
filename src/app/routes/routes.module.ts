import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { PagesModule } from './pages/pages.module';
import { PresentationModule } from '../presentation/presentation.module';
import { routes } from './routes';

@NgModule({
  imports: [SharedModule, RouterModule.forRoot(routes), PagesModule, PresentationModule],
  declarations: [],
  exports: [RouterModule]
})
export class RoutesModule {}
