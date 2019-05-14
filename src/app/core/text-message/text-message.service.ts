import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

import { Facility } from '../../model/facility/facility';
import { PortalAPIService } from '../portal-api/portal-api.service';
import { ResidentService } from '../resident/resident.service';


// twilio status docs: https://www.twilio.com/docs/api/messaging/message#message-status-values
const TEXT_MESSAGE_STATUS_QUEUED = 'queued';


@Injectable()
export class TextMessageService {
    private residentService: ResidentService;

    // formatting helper function
    // text messages use https://en.wikipedia.org/wiki/E.164 phone number formatting
    static formatPhoneNumber(phone_number: string) {
        return '+' + phone_number.replace(/[^0-9]+/g, '');
    }

    constructor(
        private injector: Injector,
        private portalAPIService: PortalAPIService
    ) {
        // due to a cyclic dependancy between the ResidentService and this
        // TextMessageService, we need to load the resident service manually
        // @see: http://stackoverflow.com/a/40860233/5578570
        setTimeout(() => this.residentService = <ResidentService> injector.get(ResidentService));
    }


    sendWelcome(family_member_phone: string, resident_facility: Facility): Observable<boolean> {
        const messageData = {
            family_member_phone: TextMessageService.formatPhoneNumber( family_member_phone ),
            facility: _.get(resident_facility, 'profile.name', '')
        };

        // could check a couple things here for success, chose to check for queued status
        // could also check for an error_code > 0 if multiple status are returned
        return this.portalAPIService.sendWelcomeTextMessage(messageData)
            .flatMap(result => {
                const success = result.status === TEXT_MESSAGE_STATUS_QUEUED;

                if (success) {
                    // if successful, update any family members with this phone number to
                    // an un-blacklisted state
                    return this.residentService.updateNumberBlacklistOnResidents( family_member_phone, false )
                        .flatMap(() => Observable.of( success ));
                }

                return Observable.of( success );
            })
            .catch(error => {
                // api will return 406 if there is a twilio REST error
                if (error.status === 406) {
                    const response = error.json();

                    // look for message about blacklisted user, and update residents accordingly if needed
                    if ( response.message.toLowerCase().includes('violates a blacklist rule') ) {
                        return this.residentService.updateNumberBlacklistOnResidents( family_member_phone, true )
                            .flatMap(() => Observable.of(false)); // no message sent so return false
                    }
                }

                return Observable.throw(error);
            });
    }

}