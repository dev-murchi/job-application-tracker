import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { Auth } from './auth';
import { SvgComponentMock } from '../../../mocks/components/shared/components/svg/svg-mock';
import { ThemeSwitchMock } from '../../../mocks/components/shared/components/theme-switch/theme-switch-mock';
import { SvgComponent } from '../../shared/components/svg/svg';
import { ThemeSwitch } from '../../shared/components/theme-switch/theme-switch';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let routerEvents: BehaviorSubject<any>;
  let routerSpy: jasmine.SpyObj<Router>;

  const activatedRouteMock = {
    snapshot: { root: {} },
    root: { firstChild: null },
    outlet: 'primary',
  };

  beforeEach(async () => {
    routerEvents = new BehaviorSubject(new NavigationEnd(0, '/auth/login', '/auth/login'));

    routerSpy = jasmine.createSpyObj(
      'Router',
      ['navigateByUrl', 'createUrlTree', 'serializeUrl', 'isActive'],
      {
        events: routerEvents.asObservable(),
        url: '/auth/login',
      },
    );

    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    })
      .overrideComponent(Auth, {
        remove: { imports: [ThemeSwitch, SvgComponent] },
        add: { imports: [ThemeSwitchMock, SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
