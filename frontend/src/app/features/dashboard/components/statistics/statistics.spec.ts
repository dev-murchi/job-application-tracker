import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { Statistics } from './statistics';
import { JobsService } from '../../../../core/services/jobs';
import { provideRouter } from '@angular/router';
import { ActivityBarChartMock } from '../../../../../mocks/components/shared/components/activity-bar-chart/activity-bar-chart-mock';
import { LoadingSpinnerMock } from '../../../../../mocks/components/shared/components/loading-spinner/loading-spinner-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { ActivityBarChart } from '../../../../shared/components/activity-bar-chart/activity-bar-chart';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { SvgComponent } from '../../../../shared/components/svg/svg';

describe('Statistics', () => {
  let component: Statistics;
  let fixture: ComponentFixture<Statistics>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('JobsService', ['getStatistics'], {
      jobStatistics: jasmine
        .createSpy()
        .and.returnValue({ data: null, isLoading: false, error: null }),
    });

    await TestBed.configureTestingModule({
      imports: [Statistics],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: JobsService, useValue: spy },
      ],
    })
      .overrideComponent(Statistics, {
        remove: { imports: [SvgComponent, LoadingSpinner, ActivityBarChart] },
        add: { imports: [SvgComponentMock, LoadingSpinnerMock, ActivityBarChartMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Statistics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
