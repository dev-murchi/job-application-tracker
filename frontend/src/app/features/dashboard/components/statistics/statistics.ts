import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../../../../core/services/jobs';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { JobStatus } from '../../../../shared/types/job-status';
import { CommonModule } from '@angular/common';
import { ActivityBarChart } from '../../../../shared/components/activity-bar-chart/activity-bar-chart';

interface StatusStat {
  label: string;
  status: JobStatus;
  value: number;
  valueCss: string;
  backgroundClass: string;
  dotClass: string;
}

interface TrendsSummary {
  averagePerMonth: string;
  mostActiveMonth: number;
  totalPeriod: string;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink, SvgComponent, LoadingSpinner, ActivityBarChart],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class Statistics implements OnInit {
  private readonly jobsService = inject(JobsService);
  readonly jobStats = this.jobsService.jobStatistics;

  readonly totalApplications = computed(() => {
    const stats = this.jobStats();
    if (!stats.data?.defaultStats) {
      return 0;
    }
    return Object.values(stats.data.defaultStats).reduce((sum: number, val: any) => sum + val, 0);
  });

  readonly successRate = computed(() => {
    const stats = this.jobStats();
    if (!stats.data?.defaultStats) {
      return '0.0';
    }
    const total = this.totalApplications();
    if (total === 0) {
      return '0.0';
    }
    const successful =
      (stats.data.defaultStats.offered || 0) + (stats.data.defaultStats.accepted || 0);
    return ((successful / total) * 100).toFixed(1);
  });

  readonly interviewRate = computed(() => {
    const stats = this.jobStats();
    if (!stats.data?.defaultStats) {
      return '0.0';
    }
    const total = this.totalApplications();
    if (total === 0) {
      return '0.0';
    }

    return ((stats.data.defaultStats.interview / total) * 100).toFixed(1);
  });

  readonly responseRate = computed(() => {
    const stats = this.jobStats();
    if (!stats.data?.defaultStats) {
      return '0.0';
    }
    const total = this.totalApplications();
    if (total === 0) {
      return '0.0';
    }
    const responded =
      (stats.data.defaultStats.interview || 0) +
      (stats.data.defaultStats.offered || 0) +
      (stats.data.defaultStats.accepted || 0) +
      (stats.data.defaultStats.declined || 0);
    return ((responded / total) * 100).toFixed(1);
  });

  // Computed data for breakdown component
  readonly statusBreakdown = computed((): StatusStat[] => {
    const stats = this.jobStats();
    if (!stats.data?.defaultStats) {
      return [];
    }

    return [
      {
        label: 'Total Applications',
        status: JobStatus.All,
        value: this.totalApplications(),
        valueCss: 'text-[var(--color-text-secondary)]',
        backgroundClass: 'bg-[var(--color-bg-active)]/50 hover:bg-[var(--color-bg-active)]',
        dotClass: 'bg-[var(--color-text-secondary)]',
      },
      {
        label: 'Pending',
        status: JobStatus.Pending,
        value: stats.data.defaultStats.pending || 0,
        valueCss: 'text-[var(--color-job-status-pending-text)]',
        backgroundClass:
          'bg-[var(--color-job-status-pending-bg)]/50 hover:bg-[var(--color-job-status-pending-bg)]',
        dotClass: 'bg-[var(--color-job-status-pending-text)]',
      },
      {
        label: 'Interview',
        status: JobStatus.Interview,
        value: stats.data.defaultStats.interview || 0,
        valueCss: 'text-[var(--color-job-status-interview-text)]',
        backgroundClass:
          'bg-[var(--color-job-status-interview-bg)]/50 hover:bg-[var(--color-job-status-interview-bg)]',
        dotClass: 'bg-[var(--color-job-status-interview-text)]',
      },
      {
        label: 'Offered',
        status: JobStatus.Offered,
        value: stats.data.defaultStats.offered || 0,
        valueCss: 'text-[var(--color-job-status-offered-text)]',
        backgroundClass:
          'bg-[var(--color-job-status-offered-bg)]/50 hover:bg-[var(--color-job-status-offered-bg)]',
        dotClass: 'bg-[var(--color-job-status-offered-text)]',
      },
      {
        label: 'Accepted',
        status: JobStatus.Accepted,
        value: stats.data.defaultStats.accepted || 0,
        valueCss: 'text-[var(--color-job-status-accepted-text)]',
        backgroundClass:
          'bg-[var(--color-job-status-accepted-bg)]/50 hover:bg-[var(--color-job-status-accepted-bg)]',
        dotClass: 'bg-[var(--color-job-status-accepted-text)]',
      },
      {
        label: 'Declined',
        status: JobStatus.Declined,
        value: stats.data.defaultStats.declined || 0,
        valueCss: 'text-[var(--color-job-status-declined-text)]',
        backgroundClass:
          'bg-[var(--color-job-status-declined-bg)]/50 hover:bg-[var(--color-job-status-declined-bg)]',
        dotClass: 'bg-[var(--color-job-status-declined-text)]',
      },
    ];
  });

  // Computed data for trends chart component
  readonly monthlyChartData = computed(() => {
    const stats = this.jobStats();
    if (!stats.data?.monthlyApplications) {
      return [];
    }

    return stats.data.monthlyApplications.map((month: any) => ({
      value: month.count,
      label: new Date(month.date + '-01').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      }),
    }));
  });

  readonly trendsSummary = computed((): TrendsSummary | null => {
    const stats = this.jobStats();
    if (!stats.data?.monthlyApplications || stats.data.monthlyApplications.length === 0) {
      return null;
    }

    const maxMonth = Math.max(...stats.data.monthlyApplications.map((m: any) => m.count), 1);
    const avgPerMonth = (this.totalApplications() / 6).toFixed(1);

    return {
      averagePerMonth: avgPerMonth,
      mostActiveMonth: maxMonth,
      totalPeriod: '6 months',
    };
  });

  ngOnInit(): void {
    this.jobsService.getStatistics();
  }
}
