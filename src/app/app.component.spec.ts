/* tslint:disable:no-unused-variable */

import { TestBed, async} from '@angular/core/testing';
import { AppComponent } from './app.component';

import { CoreModule } from './core/core.module';
import { LayoutModule } from './layout/layout.module';
import { SharedModule } from './shared/shared.module';
import { RoutesModule } from './routes/routes.module';
import { APP_BASE_HREF } from '@angular/common';

describe('App: OlympusPortal', () => {
    beforeEach(() => {
        window.ga = () => {};

        TestBed.configureTestingModule({
            declarations: [
                AppComponent
            ],
            imports: [
                CoreModule,
                LayoutModule,
                SharedModule,
                RoutesModule
            ],
            providers: [
                { provide: APP_BASE_HREF, useValue: '/' }
            ]
        });
    });

    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    }));

});
