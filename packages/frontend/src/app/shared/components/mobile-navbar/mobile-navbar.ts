import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { ThemeSwitch } from '../theme-switch/theme-switch';

@Component({
  selector: 'app-mobile-navbar',
  standalone: true,
  imports: [Sidebar, ThemeSwitch],
  templateUrl: './mobile-navbar.html',
  styleUrls: ['./mobile-navbar.css']
})
export class MobileNavbar {
  @Input() items: Array<{ text: string; link: string; icon: string }> = [];

  mobileMenuOpen = false;

  onToggleMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
