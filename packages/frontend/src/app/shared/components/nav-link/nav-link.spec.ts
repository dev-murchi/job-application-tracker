import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavLink } from './nav-link';
import { SvgComponent } from '../svg/svg';
import { SvgComponentMock } from '../../../../mocks/components/shared/components/svg/svg-mock';
import { provideRouter } from '@angular/router';

describe('NavLink', () => {
  let component: NavLink;
  let fixture: ComponentFixture<NavLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavLink],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    })
      .overrideComponent(NavLink, {
        remove: { imports: [SvgComponent] },
        add: { imports: [SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NavLink);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('link', 'link');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
