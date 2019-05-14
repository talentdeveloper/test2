import * as _ from 'lodash';
import * as moment from 'moment';

import { AfterViewInit, Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

import { allProducts, PRODUCTS } from './../../../model/content/base-content';
import {
  IHasProducts,
  ISelectedRange,
  SELECTED_RANGE_FOR_NAMES
} from '../../../core/dashboard-api/dashboard-api.service';

export const DRILL_DOWN_DATE_SELECTOR_COMPONENT_NAME = 'drill-down-date-selector';

@Component({
  selector: 'app-drill-down-date-selector',
  styleUrls: ['./drill-down-date-selector.component.scss'],
  templateUrl: './drill-down-date-selector.component.html'
})
export class DrillDownDateSelectorComponent implements AfterViewInit, OnChanges {
  @Input()
  title: string;
  @Input()
  products: IHasProducts = {
    hasApolloData: false,
    hasEngageData: false,
    hasFocusData: false,
    hasRehabData: false
  };
  @Input()
  firstYear: number;
  @Input()
  selectedRange: ISelectedRange = {
    for: 'year',
    date: moment(),
    productFilter: allProducts
  };
  @Output()
  rangeChanged: EventEmitter<ISelectedRange> = new EventEmitter<ISelectedRange>();

  today = moment();
  monthNames = [];
  availableYears = [];
  selectedProduct = 'All Products';

  constructor() {}

  ngAfterViewInit() {
    this.setRange();
  }

  ngOnChanges() {
    if (!this.products) {
      this.products = {
        hasApolloData: false,
        hasEngageData: false,
        hasFocusData: false,
        hasRehabData: false
      };
    }
    this.setRange(this.selectedRange, true);
  }

  emitChangeEvent(newRange: ISelectedRange) {
    this.selectedRange = newRange;
    this.rangeChanged.emit(this.selectedRange);
  }

  setRange(
    values?: {
      productFilter?: string;
      for?: string;
      date?: any;
    },
    isChangesEvent = false
  ) {
    if (!this.firstYear || !this.products) {
      return;
    }

    const newRange: ISelectedRange = Object.assign({}, this.selectedRange, values);

    if (values && values.productFilter) {
      newRange.productFilter = values.productFilter;
    }

    if (values && values.for) {
      newRange.for = values.for;
    }

    if (values && values.date) {
      newRange.date = values.date;
    }

    if (newRange.for === SELECTED_RANGE_FOR_NAMES.YEAR) {
      this.createYearButtons();
    } else if (newRange.for === SELECTED_RANGE_FOR_NAMES.MONTH) {
      this.createMonthButtons();
    }

    if (!isChangesEvent) {
      this.emitChangeEvent(newRange);
    }
  }

  setProductFilter(product: string) {
    if (product === allProducts) {
      this.selectedProduct = 'All Products';
    } else if (product === PRODUCTS.ENGAGE) {
      this.selectedProduct = 'Engage';
    } else if (product === PRODUCTS.FOCUS) {
      this.selectedProduct = 'Focus';
    } else if (product === PRODUCTS.REHAB) {
      this.selectedProduct = 'Rehab';
    }

    this.setRange({ productFilter: product });
  }

  getDayViewDateString(): string {
    return this.selectedRange.date.format('MMMM D, YYYY');
  }

  getMonthViewDateString(): string {
    return this.selectedRange.date.format('MMMM YYYY');
  }

  incrementDayViewDate() {
    const newDate = moment(this.selectedRange.date).add(1, 'day');
    this.setRange({ for: 'day', date: newDate });
  }

  decrementDayViewDate() {
    const newDate = moment(this.selectedRange.date).add(-1, 'day');
    this.setRange({ for: 'day', date: newDate });
  }

  setMonthViewDate(date: any) {
    const newDate = moment(date);
    this.setRange({ for: 'month', date: newDate });
  }

  setYearViewDate(year: number) {
    const newDate = moment(year + '-01-01', 'YYYY-MM-DD');
    this.setRange({ for: 'year', date: newDate });
  }

  rangeButtonClass(buttonDate: { year?: number; date?: any }): string {
    const buttonType =
      (buttonDate.year && this.selectedRange.date.year() === buttonDate.year) ||
      (buttonDate.date &&
        this.selectedRange.date.format('YYYY-MM') === buttonDate.date.format('YYYY-MM'))
        ? 'btn-primary'
        : 'btn-default';

    return `btn ${buttonType} range-button`;
  }

  showLeftArrow(): boolean {
    const selectedDate = this.momentDateString(this.selectedRange.date);
    return selectedDate > this.momentDateString(this.getMinDate());
  }

  showRightArrow() {
    const selectedDate = this.momentDateString(this.selectedRange.date);
    const todaysDate = this.momentDateString(this.today);
    return selectedDate < todaysDate;
  }

  momentDateString(momentDate): string {
    return momentDate.format('YYYY-MM-DD');
  }

  showProductFilterMenu(): boolean {
    return this.products
      ? Number(this.products.hasEngageData || 0) +
          Number(this.products.hasFocusData || 0) +
          Number(this.products.hasRehabData || 0) >
          1
      : false;
  }

  private createMonthButtons() {
    const year = this.selectedRange.date.year();
    const d = moment({ year: year, month: 0, date: 1 });
    this.monthNames = [];
    for (let i = 0; i < 12; i++) {
      this.monthNames.push({
        date: moment(d),
        name: d.format('MMMM'),
        isFutureDate: d.isAfter(moment())
      });
      d.add(1, 'month');
    }
  }

  private createYearButtons() {
    this.availableYears = _.range(this.firstYear || moment().year(), moment().year() + 1);
    if (this.availableYears.length > 12) {
      this.availableYears = this.availableYears
        .reverse()
        .slice(0, 12)
        .reverse();
    }
  }

  private getMinDate(): any {
    return moment(Math.min(...this.availableYears, moment().year()) + '-01-01', 'YYYY-MM-DD');
  }
}
