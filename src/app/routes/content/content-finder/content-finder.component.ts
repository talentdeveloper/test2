import * as _ from 'lodash';
import * as moment from 'moment';

import {
  Component, EventEmitter, Input,
  OnChanges, OnInit, Output, ViewChild
} from '@angular/core';
import {
  IActionMapping, TREE_ACTIONS, TreeComponent, TreeModel,
  TreeNode
} from 'angular2-tree-component';
import { Observable } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseFormComponent } from '../../../util/FormUtil';
import { CustomValidators } from 'ng2-validation';

import { ContentService, IContentMap, ROOT_NODE_ID } from '../../../core/content/content.service';
import { IBaseContent, contentTypes } from '../../../model/content/base-content';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { ClearCacheMessage } from '../../../core/ui-event-service/ui-clear-cache';
import { RefreshRootMessage } from '../../../core/ui-event-service/ui-content-tree';
import { Container } from '../../../model/content/container';
import {
  Content, accessibilityMap, displayTypeMap, LabelValueMap, skillLevelMap,
  tagMap, typeMap
} from '../../../model/content/content';
import { IContentFilter } from '../../../model/content/content-filter';
import { contentStatusLabels } from '../../../model/content/base-content';
import { LoaderService } from '../../../core/loader/loader.service';
import { ActiveContentItemMessage } from '../../../core/ui-event-service/ui-active-content-item';
import { InputService } from '../../../core/input/input.service';
import { CONTENT_BUCKET } from '../../../core/sync-gateway/sync-gateway.service';

const COMPONENT_NAME = 'content-finder';

interface IVirtualTreeNode {
  id: string,
  data: Content | Container,
  parent?: IVirtualTreeNode,
  children: IVirtualTreeNode[],
  root?: boolean
}

@Component({
  selector: 'app-content-finder',
  templateUrl: './content-finder.component.html',
  styleUrls: ['./content-finder.component.scss']
})
export class ContentFinderComponent extends BaseFormComponent implements OnInit, OnChanges {
  @Output() onSelect: EventEmitter<IBaseContent> = new EventEmitter();
  @Output() onContainerCreate: EventEmitter<string> = new EventEmitter();
  @Output() onContentCreate: EventEmitter<string> = new EventEmitter();
  @Output() onSimulatedDateChange: EventEmitter<string> = new EventEmitter();
  @Input() filters: IContentFilter;
  @Input() enableFilter: boolean;

  // Angle uses https://angular2-tree.readme.io/v2.8.0/docs/templates v2.8, not v3.x
  @ViewChild(TreeComponent)
  private tree: TreeComponent;
  private getRootLevelInProgress = false;
  private refreshRequestCount = 0;
  private refreshCache = false;

  contentTreeList: Array<Content | Container>;
  contentTreeMap: IContentMap;
  virtualTreeMap: {[id: string]: IVirtualTreeNode} = {};
  rootNode: IVirtualTreeNode;
  nodes: Array<any> = [];
  totalContentItems: Number = 0;
  disableTree = false;
  activeId = '';
  dateMask: Array<string | RegExp>;
  simulatedDateValue = '';

  actionMapping: IActionMapping = {
    mouse: {
      contextMenu: (tree, node, $event) => {

      },
      dblClick: TREE_ACTIONS.TOGGLE_EXPANDED,
      click: (tree, node, $event) => {
        if (node.data.nodeOptions) {
          this.onSelect.emit(node.data);
        } else {
          this.onSelect.emit(node.data.data);
        }
      },
      // FYI: this whole schema is a bit confusing, `ref.from` is actually the item intended to move
      drop: (tree: TreeModel,
           destination: TreeNode,
           $event: any,
           ref: { from: TreeNode, to: { parent: TreeNode, index: number } }) => {
        // save drop action
        this.onDrop(ref.from, ref.from.parent, destination, ref.to.index)
        // if successful, update UI
          .then(() => TREE_ACTIONS.MOVE_NODE(tree, destination, $event, ref))
      }
    }
  };

  // used on <Tree /> in template
  ngTreeConfig = {
    idField: 'id',
    childrenField: 'children',
    actionMapping: this.actionMapping,
    allowDrag: true,
    allowDrop: this.allowDrop.bind(this),
  };

  constructor(protected contentService: ContentService,
              protected fb: FormBuilder,
              protected loaderService: LoaderService,
              protected uiEventService: UiEventService) {
    super();

    this.dateMask = InputService.DATE_MASK;

    this.form = this.fb.group({
      simulatedDate: ['', Validators.compose([
        Validators.required,
        CustomValidators.date
      ])]
    });
  }

  ngOnInit() {
    this.contentService.startChangeFeed();

    this.uiEventService.subscribe(RefreshRootMessage, (refreshRootMessage: RefreshRootMessage) => {
      this.getRootLevel();
    });

    // listen to active id
    this.uiEventService.subscribe(ActiveContentItemMessage, (data) => {
      this.activeId = data.id;
    });

    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      if (clearCacheMessage.clearAllCaches) {
        this.clearCache();
      }
    });

  }

  ngOnChanges() {
    // ngOnChanges runs once before ngOnInit so getRootLevel is not needed in ngOnInit
    this.getRootLevel();
  }

  clearCache() {
    this.refreshCache = true;
  }

  getContentTreeData(): Observable<Array<Content | Container>> {
    return Observable.forkJoin(
      this.contentService.getAllContent(),
      this.contentService.getContentMap()
    ).flatMap(([items, contentMap]) => {
      const hasSimulatedDate = this.simulatedDateValue && moment(this.simulatedDateValue).isValid();
      this.contentTreeList = items.map((item) => {
        item['computed_status'] = hasSimulatedDate
          ? item.getStatusAppliedDate({contentMap: contentMap, date: new Date(this.simulatedDateValue)})
          : item.getStatus({contentMap: contentMap});

        return item;
      });

      if (this.enableFilter) {
        this.contentTreeList = this.contentTreeList.filter(item => this.shouldBeDisplayed(contentMap, item));
      }

      this.contentTreeMap = this.contentTreeList.reduce((map, curr) => {
        map[curr._id] = curr;
        return map;
      }, {});

      this.totalContentItems = this.contentTreeList.filter(item => item instanceof Content).length;
      
      return Observable.of(this.contentTreeList);
    });
  }

  private getRootLevel() {
    if (this.getRootLevelInProgress) {
      this.refreshRequestCount++;
      return;
    }

    this.getRootLevelInProgress = true;
    this.refreshRequestCount = 0;

    this.loaderService.start(COMPONENT_NAME);

    if (this.enableFilter) {
      // clear nodes otherwise there's a delay of filtered data
      this.nodes = [];
    }

    this.getContentTreeData()
      .subscribe(() => {
        this.rootNode = this.createVirtualTree(ROOT_NODE_ID);
        this.setNodeData();
        this.loaderService.stop(COMPONENT_NAME);
      }, (e) => {
        this.loaderService.stop(COMPONENT_NAME);

        this.uiEventService.dispatch(new ToasterMessage({
          body: `Could not retrieve root children, ${e.message}`,
          type: 'error'
        }));
      }, () => {
        this.getRootLevelInProgress = false;
        if (this.refreshRequestCount > 0) {
          this.getRootLevel();
        }
      });
  }

  private createVirtualTree(itemId: string, parentNode?: IVirtualTreeNode) {
    if (itemId === ROOT_NODE_ID) {
      this.virtualTreeMap = {};
    }

    const contentItem = this.contentTreeMap[itemId];

    if (!contentItem) {
      return undefined;
    }

    const node = itemId === ROOT_NODE_ID ? {
      id: ROOT_NODE_ID,
      root: true,
      children: [],
      data: contentItem
    } : {
      id: itemId,
      data: contentItem,
      parent: parentNode,
      children: []
    };

    // find children, filter out undefined values
    if (contentItem instanceof Container) {
      node.children = (contentItem.children || []).map((id) => {
        return this.createVirtualTree(id, node);
      }).filter(data => data);

      if (itemId !== ROOT_NODE_ID && this.enableFilter && !node.children.length) {
        return undefined;
      }
    }

    this.virtualTreeMap[node.id] = node;

    if (node.data instanceof Container && node.data.children) {
      node.children = [
        ...node.children,
        {
          nodeOptions: true,
          title: '+ Add Container',
          parentId: node.id,
          action: this.composeCreateAction(this.onContainerCreate)
        },
        {
          nodeOptions: true,
          title: '+ Add Content Item',
          parentId: node.id,
          action: this.composeCreateAction(this.onContentCreate)
        }
      ];
    }

    return node;
  }

  // Return true if item meets filter criteria
  shouldBeDisplayed(contentMap, item) {
    if (item._id === ROOT_NODE_ID) {
      return true;
    }

    if (item instanceof Container) {
      return true;
    }

    const content = <Content> item;

    const isInFilterDateRange = !this.filters.byActiveDates || !item.active_dates.length
      || item.active_dates.some(range => 
        this.filters.activeStartDate.isSameOrBefore(range.start) && this.filters.activeEndDate.isSameOrAfter(range.end));

    const shouldBeDisplayed = (!this.filters.byAccessibility || this.filters.accessibilities.some(a => (content.accessibility || '').includes(a)))
        && (!this.filters.byKeywords || this.filters.keywords.some(k => (content.keywords || []).includes(k)))
        && (!this.filters.byStatus || this.filters.statuses[content.content_status])
        && (!this.filters.byDisplayTypes || this.filters.displayTypes[content.display_type])
        && (!this.filters.bySkillLevels || this.filters.skillLevels.some(s => content.skill_level.includes(s)))
        && isInFilterDateRange;

    return shouldBeDisplayed;
  }

  setNodeData(listOnly = false) {
    if (listOnly) {
      this.nodes = Object.keys(this.virtualTreeMap)
        .filter(key => this.virtualTreeMap[key].data instanceof Content);
    } else {
      this.nodes = this.rootNode.children || [];
    }

    // this forces a hard refresh of the entire tree model in the component
    // component doesn't know what is loaded after a refresh, and creates
    // fake "loading" screens
    // this isn't documented, but also isn't necessary if we updated to 3.x
    // which adds new methods for handling this stuff
    this.clearTreeModel();
  }

  getNode(contentId: string): TreeNode {
    if (!contentId || contentId.length === 0) {
      throw new Error('`contentId` is missing');
    }

    return this.tree.treeModel.getNodeById(contentId);
  }

  composeCreateAction(event: EventEmitter<any>) {
    return (parentId: string) => {
      if (this.disableTree) {
        this.uiEventService.dispatch(new ToasterMessage({
          body: 'Cannot create while an operation is in process!',
          type: 'error'
        }));
        return;
      }

      return event.emit(parentId);
    };
  }

  clearTreeModel() {
    this.tree.treeModel.update();
  }

  // ripped out of
  // https://github.com/500tech/angular-tree-component/blob/c55bbf6d021b9c97bf5064c59bd22c80c632ef8c/lib/models/tree-node.model.ts#L211
  // we're on 2.8.2, code that has better APIs is 3.x+
  doForAll(node: TreeNode, fn) {
    // apply function
    fn(node);

    // recursively look at children
    if (node.children) {
      node.children.forEach((child: TreeNode) => {
        this.doForAll(child, fn);
      });
    }
  }

  allowDrop(node: TreeNode, destinationNode: TreeNode): boolean {
    if (destinationNode.parent.data.data instanceof Content) {
      return false;
    }

    // only allow drops if filters are not enabled
    return !this.enableFilter;
  }

  onDrop(node: TreeNode, from: TreeNode, to: TreeNode, index: number) {
    return new Promise((resolve, reject) => {
      if (this.disableTree) {
        this.uiEventService.dispatch(new ToasterMessage({
          body: 'Cannot move items while an existing move operation is in process!',
          type: 'error'
        }));
        return reject();
      }

      const itemId = node.data.data._id;
      const fromParentId = from.level !== 0 ? from.data.data._id: ROOT_NODE_ID;
      const toParentId = to.level !== 0 ? to.data.data._id: ROOT_NODE_ID;

      if (itemId === toParentId) {
        this.uiEventService.dispatch(new ToasterMessage({
          body: 'Cannot move item into itself!',
          type: 'error'
        }));
        return reject();
      }

      // ensure itemId isn't null and is a string (virtual nodes can provide a unique number by ng2-component-tree)
      // can only happen if there's a developer mistake
      if (typeof itemId !== 'string' || itemId.length === 0) {
        throw new Error('Invalid Content ID');
      }

      // ceil the index if it's greater than position (we have create nodes that aren't data items)
      if (to.children) {
        const maxRealChildren = to.children.length - 3;
        index = index >= maxRealChildren ? maxRealChildren: index;
      }

      // we can't do multiple move operations at the same time
      this.disableTree = true;

      // perform action
      this.contentService
        .moveItem(itemId, fromParentId, toParentId, index)
        .subscribe(() => {
          this.uiEventService.dispatch(new ToasterMessage({
            body: `${node.data.data.title} successfully moved!`,
            type: 'success'
          }));

          resolve(true);
        }, (e) => {
          this.uiEventService.dispatch(new ToasterMessage({
            body: e,
            type: 'error'
          }));

          reject(e);
        }, () => {
          this.disableTree = false;
        });
    });
  }

  simulateDate(e) {
    e.preventDefault();

    this.simulatedDateValue = moment(this.form.controls['simulatedDate'].value).format('MM/DD/YYYY');

    // clear any existing content filters, and hide filters button
    this.onSimulatedDateChange.emit( this.simulatedDateValue );

    this.getRootLevel();
  }

  clearSimulatedDate() {
    this.form.controls['simulatedDate'].setValue('');
    this.simulatedDateValue = '';

    // re-show content filters option
    this.onSimulatedDateChange.emit( this.simulatedDateValue );

    this.getRootLevel();
  }

  handleCollapseAllClick() {
    this.tree.treeModel.roots.forEach(node => {
      this.doForAll(node, (node) => { node.collapse(); });
    });
  }
}
