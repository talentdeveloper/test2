import * as _ from 'lodash';

import { Component, Input, OnChanges } from '@angular/core';

interface ISortColumn {
  title: string;
  name: string;
  sort: string;
  sortType: string;
}

interface IContentItemReport {
  title: string;
  displayType: string;
  usageCount: number;
}

@Component({
  selector: 'app-content-usage-report',
  styleUrls: ['./content-usage-report.component.scss'],
  templateUrl: './content-usage-report.component.html'
})
export class ContentUsageReportComponent implements OnChanges {
  @Input()
  reportData: IContentItemReport[] = [];
  @Input()
  uniqueItemsAccessedCount: number = -1;

  displayFullContentList = false;
  shortContentListSize = 10;
  contentTableColumns: ISortColumn[] = [
    {
      title: 'Content Title',
      name: 'title',
      sort: '',
      sortType: 'string'
    },
    {
      title: 'Content Type',
      name: 'displayType',
      sort: '',
      sortType: 'string'
    },
    {
      title: 'Times Accessed',
      name: 'usageCount',
      sort: 'desc',
      sortType: 'number'
    }
  ];
  contentTableConfig = {
    sorting: { columns: this.contentTableColumns }
  };
  displayedContentList = [];

  constructor() {}

  ngOnChanges() {
    this.update();
  }

  update() {
    this.uniqueItemsAccessedCount = this.reportData.length;

    // Default to false unless there are fewer than {{ this.shortContentListSize }} content
    this.displayFullContentList = this.reportData.length <= this.shortContentListSize;
    this.sortData(this.contentTableColumns.find(c => c.name === 'usageCount'));
  }

  sortData(sortColumn?: ISortColumn) {
    // apply sorting
    if (sortColumn) {
      this.reportData.sort((a, b) => {
        const val1 =
          sortColumn.sortType === 'string' && a[sortColumn.name]
            ? (a[sortColumn.name] || '').toLowerCase()
            : Number(a[sortColumn.name] || 0);
        const val2 =
          sortColumn.sortType === 'string' && b[sortColumn.name]
            ? (b[sortColumn.name] || '').toLowerCase()
            : Number(b[sortColumn.name] || 0);
        if (val1 > val2) {
          return sortColumn.sort === 'desc' ? -1 : 1;
        } else if (val1 < val2) {
          return sortColumn.sort === 'asc' ? -1 : 1;
        }
        return 0;
      });
    }
  }

  displayedList() {
    return this.displayFullContentList
      ? this.reportData
      : this.reportData.slice(0, this.shortContentListSize);
  }

  toggleContentListSize() {
    this.displayFullContentList = !this.displayFullContentList;
  }

  changeContentTableSort(sortColumn) {
    this.contentTableColumns.forEach(
      c => (c.sort = c.name === sortColumn.name ? c.sort || 'asc' : '')
    );
    this.sortData(sortColumn);
  }
}
