import * as _ from 'lodash';

import { Component, Input, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { ISortColumn } from '../../../shared/components/sortable-report/sortable-report.component';
import { ContentLibraryInterfaces as CLI, ContentItem } from '../../../model/content-library';

@Component({
  selector: 'app-content-library-list',
  templateUrl: './content-library-list.component.html',
  styleUrls: ['./content-library-list.component.scss']
})
export class ContentLibraryListComponent {
  @ViewChild('addFolderModal') addFolderModal: ModalDirective;
  @ViewChild('moveModal') moveModal: ModalDirective;
  @ViewChild('deleteModal') deleteModal: ModalDirective;

  @Input()
  isSearchResults = false;
  @Input()
  libraryPath = '/';
  @Input()
  allLibraryPaths: string[];
  @Input()
  libraryItems: CLI.IContentStatsResult[] = [];
  @Output()
  itemClicked: EventEmitter<CLI.IContentStatsResult> = new EventEmitter<CLI.IContentStatsResult>();
  @Output()
  changeEvent: EventEmitter<CLI.IChangeEvent> = new EventEmitter<CLI.IChangeEvent>();

  changeDetails: CLI.IChangeEvent = {};
  selectedItems: CLI.IContentStatsResult[] = [];
  newFolderName = '';
  moveToPath = '';

  contentItem: ContentItem;

  columns: ISortColumn[] = [
    {
      title: 'Name',
      key: 'title',
      sort: 'asc',
      type: 'string'
    },
    {
      title: 'Content Items',
      key: 'total_content_items',
      sort: '',
      type: 'number'
    },
    {
      title: 'Created Date',
      key: 'created_date',
      sort: '',
      type: 'date'
    },
    {
      title: 'Last Active',
      key: 'last_active',
      sort: '',
      type: 'date'
    },
    {
      title: 'Last Time Used',
      key: 'last_time_used',
      sort: '',
      type: 'date'
    },
    {
      title: 'Times Accessed',
      key: 'times_accessed',
      sort: '',
      type: 'number'
    },
    {
      title: 'Active Favorites',
      key: 'active_favorites',
      sort: '',
      type: 'number'
    },
    {
      title: 'Platform(s)',
      key: 'platforms',
      sort: '',
      type: 'string'
    }
  ];

  constructor() {}

  changeSort(sortColumn: ISortColumn) {
    this.columns.forEach(c => {
      if (c.key === sortColumn.key) {
        c.sort = c.sort === 'asc' ? 'desc' : 'asc';
        return;
      }

      c.sort = '';
    });

    this.sortData(sortColumn);
  }

  sortData(sortColumn?: ISortColumn) {
    // apply sorting
    if (sortColumn) {
      this.libraryItems.sort((a, b) => {
        const val1 =
          sortColumn.type === 'number' && a[sortColumn.key]
            ? Number(a[sortColumn.key] || 0)
            : (a[sortColumn.key] || '').toString().toLowerCase();
        const val2 =
          sortColumn.type === 'number' && b[sortColumn.key]
            ? Number(b[sortColumn.key] || 0)
            : (b[sortColumn.key] || '').toString().toLowerCase();
        if (val1 > val2) {
          return sortColumn.sort === 'desc' ? -1 : 1;
        } else if (val1 < val2) {
          return sortColumn.sort === 'asc' ? -1 : 1;
        }
        return 0;
      });
    }
  }

  /**
   * Events
   */

  emitAndClearChange(clearSelected: boolean = true) {
    this.emitChanges();
    this.clearChanges(clearSelected);
  }

  emitChanges() {
    console.log(this.changeDetails);
    this.changeEvent.emit(this.changeDetails);
  }

  clearChanges(clearSelected: boolean = true) {
    this.changeDetails = {};
    this.newFolderName = '';
    this.moveToPath = '';
    this.contentItem = null;
    if (clearSelected) {
      this.selectedItems = [];
    }
  }

  emitItemClicked(item: CLI.IContentStatsResult) {
    this.itemClicked.emit(item);
  }

  cancelModal() {
    this.clearChanges(false);
    this.addFolderModal.hide();
    this.moveModal.hide();
    this.deleteModal.hide();
  }

  /**
   * Rename folder
   */

  editFolderName(item: CLI.IContentStatsResult) {
    if (item._id) {
      return;
    }

    this.changeDetails = {
      renameFolder: {
        oldTitle: item.title,
        newTitle: item.title
      }
    };
  }

  saveFolderName(item: CLI.IContentStatsResult) {
    item.title = this.changeDetails.renameFolder.newTitle;
    this.emitAndClearChange();
  }

  cancelFolderNameChange() {
    this.clearChanges(false);
  }

  /**
   * Add folder
   */
  showAddFolderModal() {
    this.newFolderName = '';
    this.changeDetails = {
      addFolder: {
        newFolderName: ''
      }
    };

    this.addFolderModal.show();
  }

  newFolderNameIsValid() {
    return !this.libraryItems.find(item => item.title === this.newFolderName);
  }

  submitNewFolder() {
    if (!this.newFolderNameIsValid()) {
      return;
    }

    this.changeDetails.addFolder.newFolderName = this.newFolderName;
    this.emitAndClearChange();
    this.addFolderModal.hide();
  }

  /**
   * Add content
   */
  addContent() {
    this.changeDetails.addEditContentItem = { contentItem: null };
    this.emitAndClearChange();
  }

  /**
   * Select items for delete or move
   */

  isSelected(item: CLI.IContentStatsResult): boolean {
    if (item._id) {
      return !!this.selectedItems.find(val => val._id === item._id);
    }

    return !!this.selectedItems.find(val => val.title === item.title);
  }

  toggleSelection(item: CLI.IContentStatsResult) {
    if (item._id && this.selectedItems.find(val => val._id === item._id)) {
      this.selectedItems = this.selectedItems.filter(val => val._id !== item._id);
      return;
    }

    if (!item._id && this.selectedItems.find(val => val.title === item.title)) {
      this.selectedItems = this.selectedItems.filter(val => val.title !== item.title);
      return;
    }

    this.selectedItems.push(item);
  }

  /**
   * Move folder
   */
  showMoveFolderModal() {
    this.changeDetails = {
      moveItems: {
        items: this.selectedItems,
        newPath: ''
      }
    };
    this.moveModal.show();
  }

  submitMove() {
    this.changeDetails.moveItems.newPath = this.moveToPath;
    this.emitAndClearChange();
    this.moveModal.hide();
  }

  /**
   * Delete folder
   */
  showDeleteFolderModal() {
    const nonEmptyFolders = this.selectedItems.filter(
      item => !item._id && item.total_content_items > 0
    );

    if (nonEmptyFolders.length > 0) {
      this.changeDetails = {
        error: {
          message: 'Not all folders are empty. Only empty folders can be deleted.'
        }
      };
      this.emitAndClearChange();
      return;
    }

    this.changeDetails = {
      deleteItems: {
        libraryItems: this.selectedItems
      }
    };

    this.deleteModal.show();
  }

  submitDelete() {
    this.emitAndClearChange();
    this.deleteModal.hide();
  }

  /**
   * Search
   */

  updateSearch(searchText: string) {
    if (searchText && (searchText.length > 0 && searchText.length < 3)) {
      this.changeEvent.emit({
        error: { message: 'Please enter at least 3 characters to search.' }
      });
      return;
    }

    console.log('updateSearch(' + searchText + ')');
    this.changeEvent.emit({
      search: { searchText }
    });
  }
}
