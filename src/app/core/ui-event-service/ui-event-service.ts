import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export interface IUiEventMessage {
  error ?: Error;
}

export interface IEventService {
  dispatch(message: IUiEventMessage);
  subscribe<T extends IUiEventMessage>(type: IUiEventMessage, success?: Function, error?: Function);
}

export class UiEventMessage implements UiEventMessage {
  error = null;

  constructor(message ?: IUiEventMessage) {
    // this errors out in console.log
    // this.error = message.error;
  }
}

@Injectable()
export class UiEventService implements IEventService {
  events: BehaviorSubject<UiEventMessage> = new BehaviorSubject(new UiEventMessage);

  dispatch(message) {
    this.events.next(message);
  }

  subscribe<T extends UiEventMessage>(
    type: new (message ?: any) => T,
    success?: (message: T) => void,
    error?: (message: T) => void
  ) {
    return this.events.subscribe((message: T) => {
      if (message instanceof type) {
        if (message.error) {
          return error(message);
        }

        return success(message);
      }
    });
  }
}
