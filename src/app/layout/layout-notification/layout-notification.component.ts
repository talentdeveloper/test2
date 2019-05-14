/**
 *  NotificationComponent
 **
 *  This component wraps the angular2-toaster library for showing toaster
 *  messages as notifications. The messages are received through the
 *  UiEventService listener which is looking for ToasterMessage objects.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToasterService, ToasterConfig } from 'angular2-toaster/angular2-toaster';
import { Subscription } from 'rxjs/Subscription';

import { UiEventService } from '../../core/ui-event-service/ui-event-service';
import { ToasterMessage } from '../../core/ui-event-service/ui-toaster-message';


// @see toaster options: https://github.com/Stabzs/Angular2-Toaster
const DEFAULT_TOASTER_CONFIG = {
    mouseoverTimerStop: true, // default: true
    positionClass: 'toast-bottom-right',
    // timeout: 5000, // default: 5000, use this to configure all types
    timeout: {  // can also define timeouts by type
        error: 0, // make all error notifications sticky by default
        info: 0,
        success: 3000,
        wait: 0, // make all wait notifications sticky by default
        warning: 0 // make all warning notifications sticky by default
    },
    showCloseButton: true // default: false
};


@Component({
    selector: 'app-layout-notification',
    template: '<toaster-container [toasterconfig]="toasterConfig"></toaster-container>'
})
export class LayoutNotificationComponent implements OnInit, OnDestroy {

    toasterConfig: ToasterConfig;
    eventServiceSubscription: Subscription;

    constructor(
        private toasterService: ToasterService,
        private uiEventService: UiEventService
    ) {}

    ngOnInit() {
        this.toasterConfig = new ToasterConfig( DEFAULT_TOASTER_CONFIG );

        // setup UiEventService listener on ToasterMessage objects
        this.eventServiceSubscription = this.uiEventService.subscribe(ToasterMessage, (message: ToasterMessage) => {
            let config = DEFAULT_TOASTER_CONFIG;

            // see if we need to update any options for this specific toaster
            if (message.options) {
                config = Object.assign({}, DEFAULT_TOASTER_CONFIG, message.options);
            }

            this.toasterConfig = new ToasterConfig( config );


            // show the toaster notification
            return this.toasterService.pop(message.type, message.title, message.body);
        });
    }

    ngOnDestroy() {
        this.eventServiceSubscription.unsubscribe();
    }
}
