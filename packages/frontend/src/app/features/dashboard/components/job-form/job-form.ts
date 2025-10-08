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
import { CommonModule } from '@angular/common';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { LoadingSpinner } from "../../../../shared/components/loading-spinner/loading-spinner";

@Component({
  selector: 'app-job-form',
  imports: [CommonModule, ReactiveFormsModule, SubmitButton, CustomInput, NavLink, SvgComponent, LoadingSpinner],
  templateUrl: './job-form.html',
  styleUrl: './job-form.css'
})
export class JobForm {
  title = signal('Add Job Application');
  jobId: string | null = null;
  isEditMode = false;
  readonly backToPageIcon: SvgNameType = 'paginationPrevPageIcon';
  readonly infoIcon: SvgNameType = 'warningIcon';

  // Define all input configs in a single object for DRY
  readonly inputConfigs = {
    company: new InputElementText({
      value: '',
      key: 'companyControl',
      type: 'text',
      label: 'Company Name',
      placeholder: 'e.g., Google, Microsoft',
      validators: [Validators.required, Validators.maxLength(50)]
    }),
    position: new InputElementText({
      value: '',
      key: 'positionControl',
      type: 'text',
      label: 'Job Position',
      placeholder: 'e.g., Senior Software Engineer',
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    location: new InputElementText({
      value: '',
      key: 'locationControl',
      type: 'text',
      label: 'Job Location',
      placeholder: 'e.g., San Francisco, CA or Remote',
      validators: [Validators.required]
    }),
    companyWebsite: new InputElementText({
      value: '',
      key: 'companyWebsiteControl',
      type: 'url',
      label: 'Company Website',
      placeholder: 'https://company.com',
      validators: [Validators.required]
    }),
    jobPostingUrl: new InputElementText({
      value: '',
      key: 'jobPostingUrlControl',
      type: 'url',
      label: 'Job Posting URL (Optional)',
      placeholder: 'https://jobs.company.com/position-id',
      validators: []
    })
  };

  readonly statusSelection = new InputElementSelect<string>({
    value: JobStatus.Pending,
    key: 'jobStatusControl',
    label: 'Application Status',
    type: 'select',
    options: [
      { key: 'Pending', value: JobStatus.Pending },
      { key: 'Interview Scheduled', value: JobStatus.Interview },
      { key: 'Offer Received', value: JobStatus.Offered },
      { key: 'Offer Accepted', value: JobStatus.Accepted },
      { key: 'Application Declined', value: JobStatus.Declined },
    ]
  });

  readonly typeSelection = new InputElementSelect<string>({
    value: JobType.Fulltime,
    key: 'jobTypeControl',
    label: 'Employment Type',
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
        this.title.set('Edit Job Application');
        this.jobsService.getJob(id);
      }
    });

    effect(() => {
      const state = this.jobDetail();

      if (this.isEditMode) {
        if (state.isLoading) {
          console.log('Loading job detail...');
        }
        else if (state.error) {
          this.alertService.show(state.error, 'error');
        }
        // fetched
        else if (state.operation === 'fetch' && state.data) {
          this.patchFormOnJobLoad();
        }
        // updated
        else if (state.operation === 'update' && state.data) {
          this.alertService.show('Job application updated successfully!', 'success');
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
            this.alertService.show('Job application created successfully!', 'success');
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
        companyWebsiteControl: state.data.companyWebsite,
        jobPostingUrlControl: state.data.jobPostingUrl,
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
      this.alertService.show('Please fill in all required fields correctly.', 'error');
      return;
    }

    if (this.form.pristine && this.isEditMode) {
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

  cancelEdit() {
    if (this.jobId) {
      this.router.navigate([`/dashboard/jobs/${this.jobId}`]);
    } else {
      this.router.navigate(['/dashboard/jobs']);
    }
  }
}
