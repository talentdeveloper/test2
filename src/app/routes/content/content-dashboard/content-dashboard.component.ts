import * as moment from 'moment';
import * as _ from 'lodash';

import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { RoleService } from '../../../core/role/role.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { Container } from '../../../model/content/container';
import { Content } from '../../../model/content/content';
import { contentTypes } from '../../../model/content/base-content';
import { ContentService, IContentMap } from '../../../core/content/content.service';
import { ResidentService } from '../../../core/resident/resident.service';

const COMPONENT_NAME = 'content-dashboard';

@Component({
  selector: 'app-content-dashboard',
  templateUrl: './content-dashboard.component.html'
})
export class ContentDashboardComponent implements OnInit {
  contentItems: {
    _id: string;
    title: string;
    thisWeek: number;
    lastWeek: number;
  }[] = [];

  mostChanged = [];
  mostUsed = [];

  constructor(
    protected route: ActivatedRoute,
    protected loaderService: LoaderService,
    protected contentService: ContentService,
    protected residentService: ResidentService
  ) {}

  ngOnInit() {
    // this.loaderService.start(COMPONENT_NAME);
    // Observable.forkJoin(
    //   this.contentService.getAllContent(),
    //   this.analyticsService.getContentAnalyticsData({
    //     for: ANALYTICS_KEY_NAMES.LAST_WEEK,
    //     date: moment(),
    //     productFilter: null
    //   }),
    //   this.analyticsService.getContentAnalyticsData({
    //     for: ANALYTICS_KEY_NAMES.THIS_WEEK,
    //     date: moment(),
    //     productFilter: null
    //   })
    // ).subscribe(
    //   ([allContent, lastWeekData, thisWeekData]: [
    //     Array<Content | Container>,
    //     IAnalyticsData[],
    //     IAnalyticsData[]
    //   ]) => {
    //     this.mostChanged = allContent
    //       .filter(item => item.type === contentTypes.CONTENT)
    //       .map(content => {
    //         return {
    //           _id: content._id,
    //           title: content.title,
    //           thisWeek: thisWeekData.reduce(
    //             (total, data) => (data.key.contentId === content._id ? total + data.value : total),
    //             0
    //           ),
    //           lastWeek: lastWeekData.reduce(
    //             (total, data) => (data.key.contentId === content._id ? total + data.value : total),
    //             0
    //           ),
    //           delta: 0
    //         };
    //       });
    //     this.mostChanged = this.mostChanged
    //       .map(item => {
    //         item.delta = item.thisWeek - item.lastWeek;
    //         return item;
    //       })
    //       .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    //     this.mostUsed = this.mostChanged
    //       .map(item => {
    //         return {
    //           _id: item._id,
    //           title: item.title,
    //           thisWeek: item.thisWeek
    //         };
    //       })
    //       .sort((a, b) => b.thisWeek - a.thisWeek)
    //       .slice(0, 10);
    //     this.mostChanged = this.mostChanged.slice(0, 10);
    //     this.loaderService.stop(COMPONENT_NAME);
    //   }
    // );
  }
}
