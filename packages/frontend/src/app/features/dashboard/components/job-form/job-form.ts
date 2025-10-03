import { Component, inject, signal, effect, DestroyRef } from '@angular/core';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomInput } from "../../../../shared/components/form-items/input/input";
import { InputElementText } from '../../../../shared/components/form-helpers/input-element-text';
import { InputControlService } from '../../../../shared/components/form-helpers/input-control-service';
import { InputElementSelect } from '../../../../shared/components/form-helpers/input-element-select';
import { JobStatus } from '../../../../shared/types/job-status';
import { JobType } from '../../../../shared/types/job-type';
import { JobsService } from '../../../../core/services/jobs';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SvgNameType } from '../../../../svg.config';
import { NavLink } from "../../../../shared/components/nav-link/nav-link";

@Component({
  selector: 'app-job-form',
  imports: [ReactiveFormsModule, SubmitButton, CustomInput, NavLink],
  templateUrl: './job-form.html',
  styleUrl: './job-form.css'
})
export class JobForm {
  title = signal('Add Job');
  jobId: string | null = null;
  isEditMode = false;
  readonly backToPageIcon: SvgNameType = 'paginationPrevPageIcon';

  // Define all input configs in a single object for DRY
  readonly inputConfigs = {
    company: new InputElementText({
      value: '', key: 'companyControl', type: 'text', label: 'Company', placeholder: '', validators: [Validators.required]
    }),
    position: new InputElementText({
      value: '', key: 'positionControl', type: 'text', label: 'Position', placeholder: '', validators: [Validators.required]
    }),
    location: new InputElementText({
      value: '', key: 'locationControl', type: 'text', label: 'Location', placeholder: '', validators: [Validators.required]
    }),
    companyWebsite: new InputElementText({
      value: '', key: 'companyWebsiteControl', type: 'text', label: 'Company Website', placeholder: '', validators: [Validators.required]
    }),
    jobPostingUrl: new InputElementText({
      value: '', key: 'jobPostingUrlControl', type: 'text', label: 'Job Posting URL', placeholder: '', validators: []
    })
  };

  readonly statusSelection = new InputElementSelect<string>({
    value: JobStatus.Pending,
    key: 'jobStatusControl',
    label: 'Status',
    type: 'select',
    options: [
      { key: 'Pending', value: 'pending' },
      { key: 'Interview', value: 'interview' },
      { key: 'Offered', value: 'offered' },
      { key: 'Accepted', value: 'accepted' },
      { key: 'Declined', value: 'declined' },
    ]
  });

  readonly typeSelection = new InputElementSelect<string>({
    value: JobType.Fulltime,
    key: 'jobTypeControl',
    label: 'Job Type',
    type: 'select',
    options: [
      { key: 'Full-Time', value: JobType.Fulltime },
      { key: 'Part-Time', value: JobType.PartTime },
      { key: 'Internship', value: JobType.Internship },
    ]
  });

  readonly form: FormGroup;

  private readonly jobsService = inject(JobsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);

  readonly jobDetail = this.jobsService.jobDetail;

  constructor() {
    const ics = inject(InputControlService);
    // Build form controls from inputConfigs array
    const controls = Object.values(this.inputConfigs).reduce((acc, input) => {
      acc[input.key] = ics.toFormControl(input);
      return acc;
    }, {} as Record<string, any>);

    controls[this.statusSelection.key] = ics.toFormControl(this.statusSelection);
    controls[this.typeSelection.key] = ics.toFormControl(this.typeSelection);
    this.form = new FormGroup(controls);

    // Check for edit mode
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params => {
      const id = params.get('jobId');
      if (id) {
        this.jobId = id;
        this.isEditMode = true;
        this.title.set('Edit Job');
        this.jobsService.getJob(id);
      }
    });

    effect(() => {
      const state = this.jobDetail();
      console.log({s1: state})

      if (this.isEditMode) {
        if (state.isLoading) {
          console.log('Loading job detail...');
        }
        else if(state.error) {
          this.alertService.show(state.error, 'error');
        }
        // fetched
        else if (state.operation === 'fetch' && state.data) {
          this.patchFormOnJobLoad();
        }
        // updated
        else if (state.operation === 'update' && state.data) {
          this.router.navigate([`/dashboard/jobs/${state.data._id}`]);
        }

      } else {
        if (state.operation === 'create') {
          // error
          if (state.error) {
            this.alertService.show(state.error, 'error');
          }
          // data
          else if (state.data) {
            this.router.navigate([`/dashboard/jobs/${state.data._id}`]);
          }
        }
      }
    });
  }

  // Helper to patch form with loaded job data
  private patchFormOnJobLoad() {
    const state = this.jobsService.jobDetail();
    if (state && state.data) {
      const patch: Record<string, any> = {
        companyControl: state.data.company,
        positionControl: state.data.position,
        locationControl: state.data.jobLocation,
        jobStatusControl: state.data.status,
        jobTypeControl: state.data.jobType,
      };
      this.form.patchValue(patch);
    }
  }

  // Build payload from form values using inputConfigs for DRY
  private buildPayload() {
    const payload: Record<string, any> = {
      company: this.form.value['companyControl'],
      position: this.form.value['positionControl'],
      status: this.form.value['jobStatusControl'],
      jobType: this.form.value['jobTypeControl'],
      jobLocation: this.form.value['locationControl'],
      companyWebsite: this.form.value['companyWebsiteControl'],
      jobPostingUrl: this.form.value['jobPostingUrlControl'],
    };
    return payload;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.show('Please fill in all required fields.', 'error');
      return;
    }

    if (this.form.pristine) {
      this.alertService.show('No changes detected.', 'warn');
      return;
    }

    const payload = this.buildPayload();

    if (this.isEditMode && this.jobId) {
      this.jobsService.update(this.jobId, payload);
    } else {
      this.jobsService.create(payload as any);
    }
  }
}
