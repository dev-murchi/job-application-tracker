import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topbar } from './topbar';
import { AuthService } from '../../../../core/services/auth';
import { UsersService } from '../../../../core/services/users';
import { NavLinkComponentMock } from '../../../../../mocks/components/shared/components/nav-link/nav-link-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { ThemeSwitchMock } from '../../../../../mocks/components/shared/components/theme-switch/theme-switch-mock';
import { ClickOutsideDirectiveMock } from '../../../../../mocks/components/shared/directives/click-outside-mock';
import { NavLink as NavLinkComponent } from '../../../../shared/components/nav-link/nav-link';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { ThemeSwitch } from '../../../../shared/components/theme-switch/theme-switch';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside';
import { provideRouter } from '@angular/router';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    const currentUserSignal = signal({
      profile: null,
      isLoading: true,
      isUpdated: false,
      error: null,
    });

    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getProfile'], {
      currentUser: currentUserSignal,
    });
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
      ],
    })
      .overrideComponent(Topbar, {
        remove: { imports: [NavLinkComponent, ThemeSwitch, SvgComponent, ClickOutsideDirective] },
        add: {
          imports: [
            NavLinkComponentMock,
            ThemeSwitchMock,
            SvgComponentMock,
            ClickOutsideDirectiveMock,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
