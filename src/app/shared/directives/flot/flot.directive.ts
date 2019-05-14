import * as _ from 'lodash';

import { OnInit, OnChanges, OnDestroy, Directive, ElementRef, Input, Output, SimpleChange, EventEmitter } from '@angular/core';

declare var $: any;

@Directive({
  selector: '[flot]'
})
export class FlotDirective implements OnInit, OnChanges, OnDestroy {

  element: any;
  plot: any;
  width: any;

  @Input() dataset: any;
  @Input() options: any;
  @Input() attrWidth: any;
  @Input() height: number;
  @Input() series: any;

  @Output() ready = new EventEmitter();
  @Output() plotClick = new EventEmitter();

  constructor(private el: ElementRef) {
    this.element = $(this.el.nativeElement);

    if (!$.plot) {
      console.log('Flot chart no available.');
    }

    this.plot = null;
  }

  ngOnInit() { }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    if (!$.plot) {
      return;
    }

    if (changes['dataset']) {
      this.onDatasetChanged(this.dataset);
    }

    if (changes['series']) {
      this.onSeriesToggled(this.series);
    }
  }

  init() {
    const heightDefault = 220;

    this.width = this.attrWidth || '100%';
    this.height = this.height || heightDefault;

    this.element.css({
      width: this.width,
      height: this.height
    });

    let plotObj;
    if (!this.dataset || !this.options) {
      return;
    }

    plotObj = $.plot(this.el.nativeElement, this.dataset, this.options);

    if (_.get(this, 'options.grid.clickable', false)) {
      $(this.el.nativeElement).bind('plotclick', (event, pos, item) => {
        this.plotClick.emit({event: event, pos: pos, item: item});
      });
    }

    if (this.ready) {
      this.ready.next({ plot: plotObj });
    }
    return plotObj;
  }

  onDatasetChanged(dataset) {
    if (this.plot) {
      this.plot.setData(dataset);
      this.plot.setupGrid();
      if (_.get(this, 'options.series.bars.topLabels', false)) {
        this.addBarTopLabels();
      }
      return this.plot.draw();
    } else {
      this.plot = this.init();
      if (_.get(this, 'options.series.bars.topLabels', false)) {
        this.addBarTopLabels();
      }
      this.onSeriesToggled(this.series);
      return this.plot;
    }
  }

  onSeriesToggled(series) {
    if (!this.plot || !series) {
      return;
    }

    let someData = this.plot.getData();
    for (let sName in series) {
      series[sName].forEach(toggleFor(sName));
    }

    this.plot.setData(someData);
    this.plot.draw();

    function toggleFor(sName) {
      return function(s, i) {
        if (someData[i] && someData[i][sName]) {
          someData[i][sName].show = s;
        }
      };
    }
  }

  addBarTopLabels() {
    const unit = ' ' + _.get(this, 'options.series.bars.topLabelUnit', '');
    const data = this.plot.getData()[0].data;
    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      var pointOffset = this.plot.pointOffset({x: i, y: element[1]});
      const value = _.round(element[1], 1) + (unit ? ' ' + unit : '');
      const left = _.round(pointOffset.left - 4*value.length, 0);
      const top = pointOffset.top - 35;
      $('<div style="font-size: 150%; font-weight: bold; color: black;">' + value + '</div>').css( {
        position: 'absolute',
        left: left,
        top: top,
        display: 'none'
      }).appendTo(this.plot.getPlaceholder()).fadeIn('slow');      
    }
  }

  ngOnDestroy() {
    if (this.plot) {
      this.plot.shutdown();
    }
  }
}
