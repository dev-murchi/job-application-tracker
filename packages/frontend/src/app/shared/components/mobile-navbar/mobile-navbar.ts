import { Component, inject, Input } from '@angular/core';
import { ThemeSwitch } from '../theme-switch/theme-switch';
import { NavLink as NavLinkComponent } from '../nav-link/nav-link';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';
import { AuthService } from '../../../core/services/auth';
import { NavLink } from '../../types/nav-link.data';

@Component({
  selector: 'app-mobile-navbar',
  standalone: true,
  imports: [ThemeSwitch, NavLinkComponent, SvgComponent],
  templateUrl: './mobile-navbar.html',
  styleUrls: ['./mobile-navbar.css']
})
export class MobileNavbar {
  @Input() items: Array<NavLink> = [];
  private readonly authService = inject(AuthService);

  logoutIcon: SvgNameType = 'logoutIcon';
  closeIcon: SvgNameType = 'closeIcon';
  mobileMenuIcon: SvgNameType = 'mobileMenuIcon';
  logoImage: SvgNameType = 'logo';

  mobileMenuOpen = false;

  onToggleMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
