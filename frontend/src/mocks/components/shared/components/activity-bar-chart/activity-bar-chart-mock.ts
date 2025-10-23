import { Component, input } from '@angular/core';

@Component({
  selector: 'app-activity-bar-chart',
  template: '',
})
export class ActivityBarChartMock {
  // Header
  title = input<string>('Activity Chart');
  subtitle = input<string>('');

  // Chart configuration
  chartData = input.required<{ label: string; value: number }[]>();
  orientation = input<'vertical' | 'horizontal'>('horizontal');
  chartTitle = input<string>('Bar Chart');
  chartWidth = input<number>(800);
  chartHeight = input<number>(350);
  showChartTitle = input<boolean>(false);
  showGrid = input<{ x: boolean; y: boolean }>({ x: true, y: true });
  barColor = input<string>('oklch(69.6% 0.17 162.48)');

  // Empty state
  emptyStateMessage = input<string>('No activity data available');
}
