import { Injectable } from '@angular/core';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { LoadingMessage } from '../ui-event-service/ui-loading';

@Injectable()
export class LoaderService {
  private startedBy: string[] = [];

  constructor(
    protected uiEventService: UiEventService
  ) {

  }

  start(startedBy: string) {
    this.startedBy.unshift(startedBy);
    this.uiEventService.dispatch(new LoadingMessage({enabled: true}));
  }

  stop(startedBy: string) {
    const index = this.startedBy.findIndex(val => val === startedBy);
    if (index > -1) {
      this.startedBy.splice(index, 1);
    }
    if (this.startedBy.length < 1) {
      this.uiEventService.dispatch(new LoadingMessage({enabled: false}));
    }
  }
}