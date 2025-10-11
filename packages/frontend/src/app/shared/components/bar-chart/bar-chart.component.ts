import { 
  Component, 
  effect,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ThemeSwitchService } from '../theme-switch/theme-switch-service';
import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent {

  readonly chart = viewChild(BaseChartDirective);

  readonly barChartType = 'bar' as const;

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

  private readonly themeSwitchService = inject(ThemeSwitchService);

  readonly barChartData= signal<ChartConfiguration<'bar'>['data']>({
    labels: [],
    datasets: []
  });

  readonly barChartOptions  = signal<ChartConfiguration<'bar'>['options']>({});

  constructor() {
    effect(() => {
      const inputData = this.data();
      const isDarkMode = this.themeSwitchService.theme().mode === 'dark';

      if (inputData) {
        this.barChartData.set(this.prepareChartData2(inputData, this.title(), isDarkMode));
        this.barChartData.set(this.prepareChartData2(inputData, this.title(), isDarkMode));

        this.barChartOptions.set(this.prepareChartOptions({
          orientation: this.orientation(),
          responsive: this.responsive(),
          maintainAspectRatio: this.maintainAspectRatio(),
          showTitle: this.showTitle(),
          showLegend: this.showLegend(),
          showGrid: this.showGrid(),
          title: this.title(),
          textColor: this.getTextColor(),
          gridColor: this.getGridColor()
        }));
      }
    });
  }

  private prepareChartData2(inputData: { label: string; value: number }[], title: string, isDarkMode: boolean): ChartConfiguration<'bar'>['data']  {
      
    if(inputData.length === 0) {
      return { labels: [], datasets: [] };
    }
    const labels: string[] = [];
    const dataValues: number[] = [];
    const backgroundColors: string[] = [];

    inputData.forEach((data, index) => {
      labels.push(this.formatLabel(data.label));
      dataValues.push(data.value || 0);
      backgroundColors.push(this.getBarColor(index, isDarkMode));
    });

    return {
      labels,
      datasets: [{
        label: title,
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4
      }]
    };
    
  }

  private prepareChartOptions({
    orientation,
    responsive,
    maintainAspectRatio,
    showTitle,
    showLegend,
    showGrid,
    title,
    textColor,
    gridColor
  }: {
    orientation: 'horizontal' | 'vertical',
    responsive: boolean,
    maintainAspectRatio: boolean,
    showTitle: boolean,
    showLegend: boolean,
    showGrid: { x: boolean, y: boolean },
    title: string,
    textColor: string,
    gridColor: string
  }): ChartConfiguration<'bar'>['options'] {
    const isHorizontal = orientation === 'horizontal';

    return {
      indexAxis: isHorizontal ? 'y' : 'x',
      responsive,
      maintainAspectRatio,
      plugins: {
        title: {
          display: showTitle,
          text: title,
          font: { size: 16, weight: 'bold' },
          color: textColor
        },
        legend: {
          display: showLegend,
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: showGrid.x,
            color: gridColor
          },
          ticks: {
            color: textColor,
            maxRotation: isHorizontal ? 0 : 45,
            minRotation: 0,
            font: { size: 12 },
            padding: 8
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            display: showGrid.y,
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: { size: 12 },
            padding: 8
          }
        }
      }
    };
  }

  private getBarColor(index: number, isDarkMode: boolean): string {
    const defaultColors = this.getDefaultColors(isDarkMode);
    const color= defaultColors[index % defaultColors.length];
    return getComputedStyle(document.body).getPropertyValue(color);
  }

  private getDefaultColors(isDarkMode: boolean): string[] {
    return isDarkMode ? ['--color-sky-400', '--color-emerald-400'] : ['--color-sky-700', '--color-emerald-700'];
  }

  private formatLabel(label: string): string {
    return label
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  }

  private getTextColor(): string {
    const cssColor = getComputedStyle(document.body)
      .getPropertyValue('--color-text-primary')?.trim();
    return cssColor || '#000';
  }

  private getGridColor(): string {
    const isDarkMode = this.themeSwitchService.theme().mode === 'dark';

    const cssColorDark = getComputedStyle(document.body)
      .getPropertyValue('--color-gray-700')?.trim();

    const cssColorLight = getComputedStyle(document.body)
      .getPropertyValue('--border-color')?.trim();

    const cssColor = isDarkMode ? cssColorDark : cssColorLight;
    return cssColor || '#e7e5e4';
  }
}
