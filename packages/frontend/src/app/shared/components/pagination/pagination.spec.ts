import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { Pagination } from './pagination';
import { SvgComponent } from '../svg/svg';
import { SvgComponentMock } from '../../../../mocks/components/shared/components/svg/svg-mock';

describe('Pagination', () => {
  let component: Pagination;
  let fixture: ComponentFixture<Pagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(Pagination, {
        remove: { imports: [SvgComponent] },
        add: { imports: [SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
