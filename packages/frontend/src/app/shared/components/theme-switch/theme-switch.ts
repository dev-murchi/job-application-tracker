import { Component } from '@angular/core';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-theme-switch',
  standalone: true,
  imports: [SvgComponent],
  templateUrl: './theme-switch.html',
  styleUrls: ['./theme-switch.css']
})
export class ThemeSwitch {
  isDarkMode = false;

  darkModeIcon: SvgNameType = 'darkModeIcon';
  lightModeIcon: SvgNameType = 'lightModeIcon';

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(defaultTheme);
  }

  toggle() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  changeMode(mode: 'light' | 'dark') {
    console.log({ mode })
    this.isDarkMode = mode === 'dark';
    const newTheme = mode === 'dark' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  applyTheme(theme: string) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateIcon(theme);
  }

  updateIcon(theme: string) {
    this.isDarkMode = theme === 'dark';
  }
}
