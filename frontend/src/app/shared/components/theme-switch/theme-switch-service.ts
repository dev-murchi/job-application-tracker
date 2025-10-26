import { Injectable, signal } from '@angular/core';
import { SvgNameType } from '../../../svg.config';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  icon: SvgNameType;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeSwitchService {
  private static readonly THEME_STORAGE_KEY = 'theme';
  private static readonly DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

  readonly #theme = signal<ThemeState>({
    mode: 'light',
    icon: 'lightModeIcon',
  });

  readonly theme = this.#theme.asReadonly();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const theme = this.getInitialTheme();
    this.setMode(theme);
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = localStorage.getItem(
      ThemeSwitchService.THEME_STORAGE_KEY,
    ) as ThemeMode | null;

    if (savedTheme && this.isValidTheme(savedTheme)) {
      return savedTheme;
    }

    const prefersDark = window.matchMedia?.(ThemeSwitchService.DARK_MODE_QUERY)?.matches;
    return prefersDark ? 'dark' : 'light';
  }

  private isValidTheme(theme: string): theme is ThemeMode {
    return theme === 'dark' || theme === 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', mode);
    }
  }

  private saveTheme(mode: ThemeMode): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ThemeSwitchService.THEME_STORAGE_KEY, mode);
    }
  }

  private setModeInternal(mode: ThemeMode): void {
    const themeConfig: ThemeState =
      mode === 'dark'
        ? { mode: 'dark', icon: 'darkModeIcon' }
        : { mode: 'light', icon: 'lightModeIcon' };

    this.#theme.set(themeConfig);
  }

  setMode(mode: ThemeMode): void {
    this.setModeInternal(mode);
    this.applyTheme(mode);
    this.saveTheme(mode);
  }

  toggleTheme(): void {
    const currentMode = this.#theme().mode;
    const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
    this.setMode(newMode);
  }
}
