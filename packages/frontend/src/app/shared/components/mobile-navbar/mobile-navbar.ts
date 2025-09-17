import { Component, Input } from '@angular/core';
import { ThemeSwitch } from '../theme-switch/theme-switch';
import { NavLink, NavLinkData } from '../nav-link/nav-link';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-mobile-navbar',
  standalone: true,
  imports: [ThemeSwitch, NavLink, SvgComponent],
  templateUrl: './mobile-navbar.html',
  styleUrls: ['./mobile-navbar.css']
})
export class MobileNavbar {
  @Input() items: Array<NavLinkData> = [];

  logoutIcon:SvgNameType = 'logoutIcon';
  closeIcon:SvgNameType = 'closeIcon';
  mobileMenuIcon:SvgNameType = 'mobileMenuIcon';
  logoImage:SvgNameType = 'logo';

  mobileMenuOpen = false;

  onToggleMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu() {
    this.mobileMenuOpen = false;
  }
}
