import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { JobsService } from './jobs';
import { JobsApi } from '../../api/jobs-api';

describe('JobsService', () => {
  let service: JobsService;
  let jobsApiSpy: jasmine.SpyObj<JobsApi>;

  beforeEach(() => {
    jobsApiSpy = jasmine.createSpyObj('JobsApi', [
      'getJobs',
      'getJob',
      'createJob',
      'updateJob',
      'deleteJob',
      'getJobStats',
    ]);

    TestBed.configureTestingModule({
      providers: [
        JobsService,
        { provide: JobsApi, useValue: jobsApiSpy },
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(JobsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
