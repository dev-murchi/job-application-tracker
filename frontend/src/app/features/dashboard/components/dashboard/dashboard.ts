import { Component, computed, inject, signal } from '@angular/core';
import { JobsService } from '../../../../core/services/jobs';
import { SvgNameType } from '../../../../svg.config';
import { LoadingSpinner } from "../../../../shared/components/loading-spinner/loading-spinner";
import { Params, RouterLink } from '@angular/router';
import { SvgComponent } from "../../../../shared/components/svg/svg";
import { CommonModule } from '@angular/common';
import { ActivityBarChart } from "../../../../shared/components/activity-bar-chart/activity-bar-chart";

interface QuickAction {
  label: string;
  description: string;
  icon: SvgNameType;
  link: { target: string[], queryParams?: Params }
}

interface QuickStat {
  label: string;
  value: number;
  icon: SvgNameType;
  colorClass: string;
  bgClass: string;
  link?: { target: string[], queryParams?: Params }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinner,
    RouterLink,
    SvgComponent,
    ActivityBarChart
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly jobsService = inject(JobsService);
  readonly jobStats = this.jobsService.jobStatistics;

  readonly showGrid = signal<{ x: boolean; y: boolean; }>({ x: false, y: true })

  // Computed quick stats data
  readonly quickStats = computed((): QuickStat[] => {
    const stats = this.jobStats();
    if (!stats.data?.defaultStats) return [];

    const defaultStats = stats.data.defaultStats;
    const total = Object.values(defaultStats).reduce((sum: number, val: any) => sum + val, 0);

    return [
      {
        label: 'Total Applications',
        value: total,
        icon: 'appliedJobsIcon',
        colorClass: 'text-[var(--color-text-secondary)]',
        bgClass: 'bg-[var(--color-bg-active)]',
        link: { target: ['/dashboard/jobs'] },
      },
      {
        label: 'Pending',
        value: defaultStats.pending || 0,
        icon: 'sendIcon',
        colorClass: 'text-[var(--color-job-status-pending-text)]',
        bgClass: 'bg-[var(--color-job-status-pending-bg)]',
        link: { target: ['/dashboard/jobs'], queryParams: { status: 'pending' } },
      },
      {
        label: 'Interviews',
        value: defaultStats.interview || 0,
        icon: 'scheduleIcon',
        colorClass: 'text-[var(--color-job-status-interview-text)]',
        bgClass: 'bg-[var(--color-job-status-interview-bg)]',
        link: { target: ['/dashboard/jobs'], queryParams: { status: 'interview' } },
      },
      {
        label: 'Offers',
        value: (defaultStats.offered || 0) + (defaultStats.accepted || 0),
        icon: 'checkCircleIcon',
        colorClass: 'text-[var(--color-job-status-offered-text)]',
        bgClass: 'bg-[var(--color-job-status-offered-bg)]',
        link: { target: ['/dashboard/jobs'], queryParams: { status: 'offered' } },
      },
    ];
  });

  // Computed chart data
  readonly monthlyChartData = computed(() => {
    const stats = this.jobStats();

    if (!stats.data?.monthlyApplications) return [];

    return stats.data.monthlyApplications.map((data: any) => ({
      value: data.count,
      label: new Date(data.date + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    }));
  });

  readonly quickActions = computed((): QuickAction[] => [
    {
      label: 'Add Application',
      description: 'Track a new job',
      icon: 'addJobApplicationIcon',
      link: { target: ['/dashboard/create-job'] }
    },
    {
      label: 'View All Jobs',
      description: 'Manage applications',
      icon: 'appliedJobsIcon',
      link: { target: ['/dashboard/jobs'] }
    },
    {
      label: 'View Statistics',
      description: 'Detailed insights',
      icon: 'monitoringIcon',
      link: { target: ['/dashboard/stats'] }
    }
  ]);

  constructor() {
    this.jobsService.getStatistics();
  }
}
