import { Component, input } from '@angular/core';

@Component({
  selector: 'app-activity-bar-chart',
  template: '',
})
export class ActivityBarChartMock {
  // Header
  readonly title = input<string>('Activity Chart');
  readonly subtitle = input<string>('');

  // Chart configuration
  readonly chartData = input.required<{ label: string; value: number }[]>();
  readonly orientation = input<'vertical' | 'horizontal'>('horizontal');
  readonly chartTitle = input<string>('Bar Chart');
  readonly chartWidth = input<number>(800);
  readonly chartHeight = input<number>(350);
  readonly showChartTitle = input<boolean>(false);
  readonly showGrid = input<{ x: boolean; y: boolean }>({ x: true, y: true });
  readonly barColor = input<string>('oklch(69.6% 0.17 162.48)');

  // Empty state
  readonly emptyStateMessage = input<string>('No activity data available');
}
