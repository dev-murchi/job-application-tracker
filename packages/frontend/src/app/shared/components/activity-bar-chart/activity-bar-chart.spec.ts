import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityBarChart } from './activity-bar-chart';

describe('ActivityBarChart', () => {
  let component: ActivityBarChart;
  let fixture: ComponentFixture<ActivityBarChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityBarChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityBarChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
