import { Component, inject, input } from '@angular/core';
import { ThemeSwitch } from '../theme-switch/theme-switch';
import { NavLink as NavLinkComponent } from '../nav-link/nav-link';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';
import { AuthService } from '../../../core/services/auth';
import { NavLink } from '../../types/nav-link.data';
import { ClickOutsideDirective } from '../../directives/click-outside';

@Component({
  selector: 'app-mobile-navbar',
  standalone: true,
  imports: [ThemeSwitch, NavLinkComponent, SvgComponent, ClickOutsideDirective],
  templateUrl: './mobile-navbar.html',
  styleUrls: ['./mobile-navbar.css'],
})
export class MobileNavbar {
  readonly items = input<NavLink[]>([]);

  private readonly authService = inject(AuthService);

  logoutIcon: SvgNameType = 'logoutIcon';
  closeIcon: SvgNameType = 'closeIcon';
  mobileMenuIcon: SvgNameType = 'mobileMenuIcon';
  logoImage: SvgNameType = 'logo';

  mobileMenuOpen = false;

  onToggleMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
