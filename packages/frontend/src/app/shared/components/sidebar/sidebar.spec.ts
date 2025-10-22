import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { Sidebar } from './sidebar';
import { SvgComponent } from '../svg/svg';
import { NavLink as NavLinkComponent } from '../nav-link/nav-link';
import { NavLinkComponentMock } from '../../../../mocks/components/shared/components/nav-link/nav-link-mock';
import { SvgComponentMock } from '../../../../mocks/components/shared/components/svg/svg-mock';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(Sidebar, {
        remove: { imports: [NavLinkComponent, SvgComponent] },
        add: { imports: [NavLinkComponentMock, SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
