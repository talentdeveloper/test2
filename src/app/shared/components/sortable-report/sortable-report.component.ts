import * as _ from 'lodash';

import { Component, Input, OnChanges } from '@angular/core';

export interface ISortableReport {
  id: string;
  [key: string]: any;
}

export interface ISortColumn {
  title: string;
  key: string;
  sort: string;
  type: string;
  toFixed?: number;
  styled?: boolean;
}

@Component({
  selector: 'app-sortable-report',
  styleUrls: ['./sortable-report.component.scss'],
  templateUrl: './sortable-report.component.html'
})
export class SortableReportComponent implements OnChanges {
  @Input()
  title: string;
  @Input()
  reportData: ISortableReport[] = [];
  @Input()
  columns: ISortColumn[] = [];
  @Input()
  listRouterLinkArray: string[];
  @Input()
  goToAllButtonTitle = '';

  config = {
    sorting: { columns: this.columns }
  };

  displayFullList = false;
  shortListSize = 5;

  ngOnChanges() {}

  displayedList() {
    const data = this.reportData || [];
    return this.displayFullList ? data : data.slice(0, this.shortListSize);
  }

  toggleListSize() {
    this.displayFullList = !this.displayFullList;
  }

  changeSort(sortColumn: ISortColumn) {
    this.columns.forEach(c => (c.sort = c.key === sortColumn.key ? c.sort || 'asc' : ''));
    this.sortData(sortColumn);
  }

  sortData(sortColumn?: ISortColumn) {
    // apply sorting
    if (sortColumn) {
      this.reportData.sort((a, b) => {
        const val1 =
          sortColumn.type === 'string' && a[sortColumn.key]
            ? (a[sortColumn.key] || '').toString().toLowerCase()
            : Number(a[sortColumn.key] || 0);
        const val2 =
          sortColumn.type === 'string' && b[sortColumn.key]
            ? (b[sortColumn.key] || '').toString().toLowerCase()
            : Number(b[sortColumn.key] || 0);
        if (val1 > val2) {
          return sortColumn.sort === 'desc' ? -1 : 1;
        } else if (val1 < val2) {
          return sortColumn.sort === 'asc' ? -1 : 1;
        }
        return 0;
      });
    }
  }

  getItemLinkArray(column: ISortColumn, item: ISortableReport): string {
    if (!_.isArray(item[column.key + 'Link'])) {
      return null;
    }

    return item[column.key + 'Link'];
  }

  getValue(index: number, item: ISortableReport): string | number {
    const column = this.columns[index];
    if (column.type === 'number' && column.toFixed && column.toFixed > 0) {
      return Number(item[column.key]).toFixed(column.toFixed);
    }

    return item[column.key];
  }

  cellStyle(column: ISortColumn, item: ISortableReport): string {
    if (!column.styled || !item[column.key + 'Style']) {
      return '';
    }

    return item[column.key + 'Style'].toString();
  }
}
