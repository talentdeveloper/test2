import * as moment from 'moment';

import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';

import { IUiEventMessage, UiEventMessage } from '../../core/ui-event-service/ui-event-service';

export interface IDrillDownDateRangeMessage extends IUiEventMessage {
  lastChangeSource?: string;
  for: string;
  date: moment.Moment; // moment object
  productFilter: string;
}

export class DrillDownDateRangeMessage extends UiEventMessage
  implements IDrillDownDateRangeMessage {
  lastChangeSource?: string;
  for: string;
  date: moment.Moment; // moment object
  productFilter: string;

  constructor(message: IDrillDownDateRangeMessage) {
    super();

    this.lastChangeSource = message.lastChangeSource || '';
    this.for = message.for || 'year';
    this.date = message.date || moment();
    this.productFilter = message.productFilter;
  }
}
