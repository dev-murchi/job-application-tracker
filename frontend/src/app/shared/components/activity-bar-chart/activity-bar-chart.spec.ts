import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ActivityBarChart } from './activity-bar-chart';
import { BarChartComponentMock } from '../../../../mocks/components/shared/components/bar-chart/bar-chart.component-mock';
import { SvgComponentMock } from '../../../../mocks/components/shared/components/svg/svg-mock';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { SvgComponent } from '../svg/svg';

describe('ActivityBarChart', () => {
  let component: ActivityBarChart;
  let fixture: ComponentFixture<ActivityBarChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityBarChart],
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(ActivityBarChart, {
        remove: { imports: [BarChartComponent, SvgComponent] },
        add: { imports: [BarChartComponentMock, SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ActivityBarChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('chartData', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
