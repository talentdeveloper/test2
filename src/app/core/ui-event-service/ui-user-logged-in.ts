import { UiEventMessage } from './ui-event-service';

export class UserLoggedInMessage extends UiEventMessage {
  constructor() {
    super();
  }
}

export class UserLoggedOutMessage extends UiEventMessage {
  constructor() {
    super();
  }
}
