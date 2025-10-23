import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileNavbar } from './mobile-navbar';
import { AuthService } from '../../../core/services/auth';
import { ThemeSwitch } from '../theme-switch/theme-switch';
import { NavLink as NavLinkComponent } from '../nav-link/nav-link';
import { SvgComponent } from '../svg/svg';
import { ClickOutsideDirective } from '../../directives/click-outside';
import { ThemeSwitchMock } from '../../../../mocks/components/shared/components/theme-switch/theme-switch-mock';
import { ClickOutsideDirectiveMock } from '../../../../mocks/components/shared/directives/click-outside-mock';
import { NavLinkComponentMock } from '../../../../mocks/components/shared/components/nav-link/nav-link-mock';
import { SvgComponentMock } from '../../../../mocks/components/shared/components/svg/svg-mock';

describe('MobileNavbar', () => {
  let component: MobileNavbar;
  let fixture: ComponentFixture<MobileNavbar>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [MobileNavbar],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    })
      .overrideComponent(MobileNavbar, {
        remove: { imports: [ThemeSwitch, NavLinkComponent, SvgComponent, ClickOutsideDirective] },
        add: {
          imports: [
            ThemeSwitchMock,
            NavLinkComponentMock,
            SvgComponentMock,
            ClickOutsideDirectiveMock,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MobileNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
