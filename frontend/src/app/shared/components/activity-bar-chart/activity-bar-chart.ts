import { Component, input } from '@angular/core';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { SvgComponent } from '../svg/svg';

@Component({
  selector: 'app-activity-bar-chart',
  imports: [BarChartComponent, SvgComponent],
  templateUrl: './activity-bar-chart.html',
  styleUrl: './activity-bar-chart.css',
})
export class ActivityBarChart {
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
