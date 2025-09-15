import { Component, Input } from '@angular/core';
import { ThemeSwitch } from '../theme-switch/theme-switch';
import { NavLink } from '../nav-link/nav-link';

@Component({
  selector: 'app-mobile-navbar',
  standalone: true,
  imports: [ThemeSwitch, NavLink],
  templateUrl: './mobile-navbar.html',
  styleUrls: ['./mobile-navbar.css']
})
export class MobileNavbar {
  @Input() items: Array<{ text: string; link: string; icon: string }> = [];

  mobileMenuOpen = false;

  onToggleMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu() {
    this.mobileMenuOpen = false;
  }
}
