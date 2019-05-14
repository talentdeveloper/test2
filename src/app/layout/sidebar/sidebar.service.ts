import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class SidebarService {
  public selectedParams: BehaviorSubject<Object> = new BehaviorSubject({});
  public refresh: BehaviorSubject<boolean> = new BehaviorSubject(true);
}
