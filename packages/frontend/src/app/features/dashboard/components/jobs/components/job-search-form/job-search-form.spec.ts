import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobSearchForm } from './job-search-form';

describe('JobSearchForm', () => {
  let component: JobSearchForm;
  let fixture: ComponentFixture<JobSearchForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSearchForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobSearchForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
