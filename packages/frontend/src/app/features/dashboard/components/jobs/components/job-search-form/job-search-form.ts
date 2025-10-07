import { Component, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { SvgComponent } from "../../../../../../shared/components/svg/svg";
import { InputElementText } from '../../../../../../shared/components/form-helpers/input-element-text';
import { InputControlService } from '../../../../../../shared/components/form-helpers/input-control-service';
import { InputElementSelect } from '../../../../../../shared/components/form-helpers/input-element-select';
import { JobType } from '../../../../../../shared/types/job-type';
import { JobStatus } from '../../../../../../shared/types/job-status';
import { CustomInput } from "../../../../../../shared/components/form-items/input/input";
import { JobSortOption } from '../../../../../../shared/types/job-sort-option';
import { SvgNameType } from '../../../../../../svg.config';

type SelectOption = { key: string; value: string }
// --- Type Definitions ---
export type JobSearchFormData = {
  search: string;
  sort: string;
  type: JobType;
  status: JobStatus;
};

// --- Constants for Configuration (DRY) ---
const FORM_KEYS = {
  SEARCH: 'searchInput',
  STATUS: 'statusSelection',
  TYPE: 'typeSelection',
  SORT: 'sortSelection',
} as const;

const STATUS_OPTIONS: SelectOption[] = [
  { key: 'All', value: JobStatus.All },
  { key: 'Pending', value: JobStatus.Pending },
  { key: 'Interview', value: JobStatus.Interview },
  { key: 'Declined', value: JobStatus.Declined },
];

const TYPE_OPTIONS: SelectOption[] = [
  { key: 'All', value: JobType.All },
  { key: 'Full-time', value: JobType.Fulltime },
  { key: 'Part-time', value: JobType.PartTime },
  { key: 'Internship', value: JobType.Internship },
];

const SORT_OPTIONS: SelectOption[] = [
  { key: 'Newest', value: 'newest' },
  { key: 'Oldest', value: 'oldest' },
  { key: 'A-Z', value: 'a-z' },
  { key: 'Z-A', value: 'z-a' },
];

// --- Output Event Type ---
export type JobSearchFormOutput = {
  value: JobSearchFormData;
  operation: 'search' | 'reset';
};

@Component({
  selector: 'app-job-search-form',
  imports: [ReactiveFormsModule, SvgComponent, CustomInput],
  templateUrl: './job-search-form.html',
  styleUrl: './job-search-form.css'
})
export class JobSearchForm implements OnInit {
  readonly debounceDelay = input.required<number>();
  initialSearchText = input.required<string>();
  initialJobStatus = input.required<JobStatus>();
  initialJobType = input.required<JobType>();
  initialSortOption = input.required<JobSortOption>();

  readonly jobSearchEvent = output<JobSearchFormOutput>();

  private destroyRef = inject(DestroyRef);
  clearIcon: SvgNameType = 'clearIcon';


  readonly searchBox = new InputElementText({
    value: '',
    key: FORM_KEYS.SEARCH,
    label: 'Search',
    order: 1,
    type: 'text',
    placeholder: 'Search for jobs..'
  });

  readonly statusSelection = new InputElementSelect<string>({
    value: 'all', key: FORM_KEYS.STATUS, label: 'Status', type: 'select', order: 2, options: STATUS_OPTIONS
  });

  readonly typeSelection = new InputElementSelect<string>({
    value: 'all', key: FORM_KEYS.TYPE, label: 'Type', type: 'select', order: 3, options: TYPE_OPTIONS
  });

  readonly sortSelection = new InputElementSelect<string>({
    value: 'newest', key: FORM_KEYS.SORT, label: 'Sort', type: 'select', order: 4, options: SORT_OPTIONS
  });

  readonly form: FormGroup;
  private readonly initialFormState: JobSearchFormData;

  constructor() {
    const ics = inject(InputControlService);
    this.form = new FormGroup({
      [FORM_KEYS.SEARCH]: ics.toFormControl(this.searchBox),
      [FORM_KEYS.STATUS]: ics.toFormControl(this.statusSelection),
      [FORM_KEYS.TYPE]: ics.toFormControl(this.typeSelection),
      [FORM_KEYS.SORT]: ics.toFormControl(this.sortSelection),
    });

    effect(() => {
      this.patchFormValues();
    });

    this.initialFormState = this.formValueToJobSearchData(this.form.getRawValue());
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(
      debounceTime(this.debounceDelay()),
      map((formValue) => this.formValueToJobSearchData(formValue)),
      distinctUntilChanged((prev, curr) =>
        prev.search === curr.search &&
        prev.status === curr.status &&
        prev.type === curr.type &&
        prev.sort === curr.sort
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(formData => {
      this.jobSearchEvent.emit({ value: formData, operation: 'search' });
    });
  }

  clearFormValues(): void {
    this.form.reset(this.initialFormState, { emitEvent: false });
    this.jobSearchEvent.emit({ value: this.formValueToJobSearchData(this.initialFormState), operation: 'reset' });
  }

  private patchFormValues() {
    this.form.controls[FORM_KEYS.SEARCH].patchValue(this.initialSearchText(), { emitEvent: false });
    this.form.controls[FORM_KEYS.SORT].patchValue(this.initialSortOption(), { emitEvent: false });
    this.form.controls[FORM_KEYS.STATUS].patchValue(this.initialJobStatus(), { emitEvent: false });
    this.form.controls[FORM_KEYS.TYPE].patchValue(this.initialJobType(), { emitEvent: false });
  }

  private formValueToJobSearchData(formValue: any): JobSearchFormData {
    return {
      search: formValue[FORM_KEYS.SEARCH] ?? '',
      status: formValue[FORM_KEYS.STATUS] ?? 'all',
      type: formValue[FORM_KEYS.TYPE] ?? 'all',
      sort: formValue[FORM_KEYS.SORT] ?? 'newest',
    };
  }
}
