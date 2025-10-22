import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { NotFoundPage } from './not-found-page';
import { SvgComponent } from '../../shared/components/svg/svg';
import { SvgComponentMock } from '../../../mocks/components/shared/components/svg/svg-mock';
import { provideRouter } from '@angular/router';

describe('NotFoundPage', () => {
  let component: NotFoundPage;
  let fixture: ComponentFixture<NotFoundPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    })
      .overrideComponent(NotFoundPage, {
        remove: { imports: [SvgComponent] },
        add: { imports: [SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NotFoundPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
