import { Component, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';

import {
  ContentItem,
  ContentLibraryConstants as CLC,
  ContentLibraryInterfaces as CLI
} from '../../../model/content-library';

@Component({
  selector: 'app-content-library-item',
  templateUrl: './content-library-item.component.html',
  styleUrls: ['./content-library-item.component.scss']
})
export class ContentLibraryItemComponent {
  @ViewChild('deleteModal') public deleteModal: ModalDirective;

  @Input()
  contentItem: ContentItem;
  @Input()
  itemAnalytics: CLI.IContentStatsResult;
  @Output()
  changeEvent: EventEmitter<CLI.IChangeEvent> = new EventEmitter<CLI.IChangeEvent>();

  contentTypeNames = CLC.contentTypeNames;
  displayTypeNames = CLC.displayTypeNames;

  getAccessibilityLabels() {
    return [
      {
        label: 'Hearing Impairment',
        value: this.contentItem.accessibility.hearing_impairment
      },
      {
        label: 'Physical Impairment',
        value: this.contentItem.accessibility.physical_impairment
      },
      {
        label: 'Vision Impairment',
        value: this.contentItem.accessibility.vision_impairment
      }
    ]
      .filter(item => item.value)
      .map(item => item.label)
      .join(', ');
  }

  getSkillLevelLabels() {
    return [
      {
        label: 'Level One',
        value: this.contentItem.skill_level.level_one
      },
      {
        label: 'Level Two',
        value: this.contentItem.skill_level.level_two
      },
      {
        label: 'Level Three',
        value: this.contentItem.skill_level.level_three
      }
    ]
      .filter(item => item.value)
      .map(item => item.label)
      .join(', ');
  }

  getUsageSettingsLabels() {
    return [
      {
        label: 'Solo Use',
        value: this.contentItem.usage_settings.solo_use
      },
      {
        label: 'Joint Use',
        value: this.contentItem.usage_settings.joint_use
      },
      {
        label: 'Group Use',
        value: this.contentItem.usage_settings.group_use
      }
    ]
      .filter(item => item.value)
      .map(item => item.label)
      .join(', ');
  }

  editContent() {
    this.changeEvent.emit({
      addEditContentItem: {
        contentItem: this.contentItem
      }
    });
  }

  submitDelete() {
    this.changeEvent.emit({
      deleteItems: {
        contentItem: this.contentItem
      }
    });
    this.deleteModal.hide();
  }
}
