import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeSwitch } from './theme-switch';
import { ThemeSwitchService } from './theme-switch-service';
import { SvgComponentMock } from '../../../../mocks/components/shared/components/svg/svg-mock';
import { SvgComponent } from '../svg/svg';

describe('ThemeSwitch', () => {
  let component: ThemeSwitch;
  let fixture: ComponentFixture<ThemeSwitch>;
  let themeSwitchServiceSpy: jasmine.SpyObj<ThemeSwitchService>;

  beforeEach(async () => {
    // Create a signal for theme
    const themeSignal = signal({
      icon: 'darkModeIcon',
      mode: 'dark' as 'light' | 'dark',
    });

    themeSwitchServiceSpy = jasmine.createSpyObj('ThemeSwitchService', ['toggleTheme'], {
      theme: themeSignal,
    });

    await TestBed.configureTestingModule({
      imports: [ThemeSwitch],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ThemeSwitchService, useValue: themeSwitchServiceSpy },
      ],
    })
      .overrideComponent(ThemeSwitch, {
        remove: { imports: [SvgComponent] },
        add: { imports: [SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ThemeSwitch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
