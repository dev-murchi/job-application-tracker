import { Component, input } from '@angular/core';
import { BarChartComponent } from "../bar-chart/bar-chart.component";
import { SvgComponent } from "../svg/svg";

@Component({
  selector: 'app-activity-bar-chart',
  imports: [BarChartComponent, SvgComponent],
  templateUrl: './activity-bar-chart.html',
  styleUrl: './activity-bar-chart.css'
})
export class ActivityBarChart {
// Header
  title = input<string>('Activity Chart');
  subtitle = input<string>('');
  
  // Chart configuration
  chartData = input.required<{ label: string, value: number }[]>();
  orientation = input<'vertical' | 'horizontal'>('horizontal');
  chartTitle = input<string>('Bar Chart');
  chartWidth = input<number>(800);
  chartHeight = input<number>(350);
  showChartTitle = input<boolean>(false);
  showGrid = input<{x: boolean, y: boolean }>({ x: true, y: true });
  barColor = input<string>('oklch(69.6% 0.17 162.48)');
  
  // Empty state
  emptyStateMessage = input<string>('No activity data available');
}
