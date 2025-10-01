import { Component, DestroyRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobsService } from '../../../../core/services/jobs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SvgComponent } from "../../../../shared/components/svg/svg";
import { SvgNameType } from '../../../../svg.config';

@Component({
  selector: 'app-job-detail',
  imports: [CommonModule, RouterLink, SvgComponent],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css'
})
export class JobDetail {

  private readonly jobsService = inject(JobsService);
  private readonly router = inject(Router);
  private readonly activeRoute = inject(ActivatedRoute);
  readonly job = this.jobsService.jobDetail;
  readonly backToPageIcon: SvgNameType = 'paginationPrevPageIcon';

  constructor() {
    this.activeRoute.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params => {
      const id = params.get('jobId');

      if (id) {
        this.jobsService.getJob(id);
      } else {
        this.router.navigate(['/not-found']);
      }
    })

    effect(() => {
        if(this.job().error) {
          this.router.navigate(['/not-found']);
        }
        else if(!this.job().isLoading && !this.job().data){
          this.router.navigate(['/not-found']);
        }
      }) 
  }
}
