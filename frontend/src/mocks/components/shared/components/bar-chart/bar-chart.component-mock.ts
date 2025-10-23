import { Component, input } from '@angular/core';

@Component({
  selector: 'app-bar-chart',
  template: '',
})
export class BarChartComponentMock {
  readonly data = input<{ label: string; value: number }[]>([]);
  readonly title = input<string>('Bar Chart');
  readonly width = input<number>(400);
  readonly height = input<number>(300);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly showTitle = input<boolean>(true);
  readonly showGrid = input<{ x: boolean; y: boolean }>({ x: true, y: true });
  readonly showLegend = input<boolean>(false);
  readonly responsive = input<boolean>(true);
  readonly maintainAspectRatio = input<boolean>(false);
}
