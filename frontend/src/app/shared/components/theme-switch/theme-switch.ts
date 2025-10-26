import { Component, computed, inject } from '@angular/core';
import { SvgComponent } from '../svg/svg';
import { ThemeSwitchService } from './theme-switch-service';

@Component({
  selector: 'app-theme-switch',
  standalone: true,
  imports: [SvgComponent],
  templateUrl: './theme-switch.html',
  styleUrls: ['./theme-switch.css'],
})
export class ThemeSwitch {
  private readonly themeSwitchService = inject(ThemeSwitchService);

  readonly theme = computed(() => {
    const currentTheme = this.themeSwitchService.theme();
    return {
      icon: currentTheme.icon,
      isDarkMode: currentTheme.mode === 'dark',
      mode: currentTheme.mode,
    };
  });

  toggle(): void {
    this.themeSwitchService.toggleTheme();
  }
}
