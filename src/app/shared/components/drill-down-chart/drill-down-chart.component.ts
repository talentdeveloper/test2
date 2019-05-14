import * as _ from 'lodash';
import * as moment from 'moment';
import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';

import { allProducts } from './../../../model/content/base-content';
import {
  IChartData,
  ISelectedRange,
  SELECTED_RANGE_FOR_NAMES
} from '../../../core/dashboard-api/dashboard-api.service';

const COMPONENT_NAME = 'drill-down-chart';

@Component({
  selector: 'app-drill-down-chart',
  styleUrls: ['./drill-down-chart.component.scss'],
  templateUrl: './drill-down-chart.component.html'
})
export class DrillDownChartComponent implements OnChanges {
  @Input()
  chartData: IChartData;
  @Input()
  chartDescription = '';
  @Input()
  selectedRange: ISelectedRange = {
    for: 'year',
    date: moment(),
    productFilter: allProducts
  };
  @Output()
  rangeChanged: EventEmitter<ISelectedRange> = new EventEmitter<ISelectedRange>();

  chart: {
    plot: any;
    dataset: IChartData[];
    options: any;
  } = {
    plot: null,
    dataset: [],
    options: {
      series: {
        bars: {
          show: true,
          align: 'center',
          barWidth: 0.9,
          fill: true,
          fillColor: {
            colors: ['#75A9E5', '#527598']
          },
          lineWidth: 0
        },
        lines: {
          show: false,
          lineWidth: 1,
          fill: true,
          fillColor: {
            colors: ['#527598', '#75A9E5']
          }
        },
        points: {
          show: false,
          radius: 8
        },
        splines: {
          show: false
        },
        color: '#75A9E5'
      },
      grid: {
        borderColor: '#eee',
        borderWidth: 1,
        clickable: true,
        hoverable: true,
        backgroundColor: '#fcfcfc'
      },
      tooltip: true,
      tooltipOpts: {
        content: (label, xval, yval) => {
          if (typeof yval === 'number') {
            return `${yval.toFixed(2)} hrs`;
          }

          return label;
        }
      },
      xaxis: {
        tickColor: '#fcfcfc',
        mode: 'categories'
      },
      yaxis: {
        min: 0,
        tickColor: '#eee',
        tickFormatter: v => `${(v || 0).toFixed(1)} hrs`,
        ticks: axis => {
          // This code is modified from the default tick generator in the flot code
          const maxDec = axis.options.tickDecimals;
          let dec = -Math.floor(Math.log(axis.delta) / Math.LN10);

          if (maxDec != null && dec > maxDec) {
            dec = maxDec;
          }

          const magn = Math.pow(10, -dec);
          const norm = axis.delta / magn; // norm is between 1.0 and 10.0
          let size;
          const ticks = [];
          let start;
          let i = 0;
          let v = Number.NaN;
          let prev;

          if (norm < 1.5) {
            size = 1;
          } else if (norm < 3) {
            size = 2;
            // special case for 2.5, requires an extra decimal
            if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
              size = 2.5;
              ++dec;
            }
          } else if (norm < 7.5) {
            size = 5;
          } else {
            size = 10;
          }

          size *= magn;

          if (axis.options.minTickSize != null && size < axis.options.minTickSize) {
            size = axis.options.minTickSize;
          }

          axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
          axis.tickSize = axis.options.tickSize || size;

          function floorInBase(n, base) {
            return base * Math.floor(n / base);
          }

          start = floorInBase(axis.min, axis.tickSize);

          do {
            prev = v;
            v = start + i * axis.tickSize;
            ticks.push(v);
            ++i;
          } while (v < axis.max && v !== prev);

          // if the largest tick value is less than 0.5 then set the ticks to 0 to 0.5
          if (ticks[ticks.length - 1] < 0.5) {
            return [0, 0.1, 0.2, 0.3, 0.4, 0.5];
          }

          return ticks;
        }
      },
      shadowSize: 0
    }
  };

  constructor() {}

  ngOnChanges() {
    if (!this.chartData || !this.chartData.data || !this.chartData.data.length) {
      return;
    }

    this.chart.dataset = [this.chartData];
  }

  emitChangeEvent(newRange: ISelectedRange) {
    this.selectedRange = newRange;
    this.rangeChanged.emit(this.selectedRange);
  }

  setChartType(useBars: boolean) {
    if (!this.chart.plot || !this.chart.plot.getOptions) {
      return;
    }

    const chartOptions = this.chart.plot.getOptions();
    chartOptions.series.bars.show = useBars;
    chartOptions.series.lines.show = !useBars;
    chartOptions.series.points.show = !useBars;
    this.chart.plot.triggerRedrawOverlay();
  }

  chartClick(clickEvent: { event: any; pos: { x: number; y: number }; item: any }) {
    if (!clickEvent || !clickEvent.item) {
      return;
    }

    let newDate: moment.Moment;
    let newFor: string;
    if (this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.YEAR) {
      const year = this.selectedRange.date.year();
      const month = _.padStart(clickEvent.item.dataIndex + 1, 2, '0');
      newDate = moment(year + '-' + month + '-01', 'YYYY-MM-DD');
      newFor = SELECTED_RANGE_FOR_NAMES.MONTH;
    } else if (this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.MONTH) {
      const year = this.selectedRange.date.year();
      const month = this.selectedRange.date.month() + 1;
      const day = _.padStart(clickEvent.item.dataIndex + 1, 2, '0');
      newDate = moment(year + '-' + month + '-' + day, 'YYYY-MM-DD');
      newFor = SELECTED_RANGE_FOR_NAMES.DAY;
    } else {
      return;
    }

    if (newDate.isAfter(moment())) {
      return;
    }

    this.emitChangeEvent(
      Object.assign({}, this.selectedRange, {
        for: newFor,
        date: newDate
      })
    );
  }

  chartReady(event: any) {
    this.chart.plot = event.plot;
  }

  momentDateString(momentDate): string {
    return momentDate.format('YYYY-MM-DD');
  }
}
