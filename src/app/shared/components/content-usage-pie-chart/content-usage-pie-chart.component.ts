import * as _ from 'lodash';
import * as moment from 'moment';

import { Component, OnChanges, Input } from '@angular/core';
import { IPieChartData } from '../../../core/dashboard-api/dashboard-api.service';

@Component({
  selector: 'app-content-usage-pie-chart',
  styleUrls: ['./content-usage-pie-chart.component.scss'],
  templateUrl: './content-usage-pie-chart.component.html'
})
export class ContentUsagePieChartComponent implements OnChanges {
  @Input()
  chartData: IPieChartData = { data: [] };

  contentPieChart = {
    plot: null,
    dataset: [],
    options: {
      series: {
        pie: {
          show: true,
          innerRadius: 0,
          label: {
            show: true,
            radius: 0.8,
            formatter: function(label, series) {
              return '<div class="flot-pie-label">' + Math.round(series.percent) + '%</div>';
            },
            background: {
              opacity: 0.8,
              color: '#222'
            }
          }
        }
      }
    }
  };

  constructor() {}

  ngOnChanges() {
    this.update();
  }

  update() {
    this.contentPieChart.dataset =
      this.chartData && this.chartData.data && this.chartData.data.length
        ? this.chartData.data
        : [];
  }
}
