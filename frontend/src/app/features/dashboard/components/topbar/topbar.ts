import { Component, inject, OnInit, signal } from '@angular/core';
import { ThemeSwitch } from '../../../../shared/components/theme-switch/theme-switch';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { AuthService } from '../../../../core/services/auth';
import { UsersService } from '../../../../core/services/users';
import { NavLink } from '../../../../shared/types/nav-link.data';
import { NavLink as NavLinkComponent } from '../../../../shared/components/nav-link/nav-link';
import { RouterLink } from '@angular/router';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside';

@Component({
  selector: 'app-topbar',
  imports: [NavLinkComponent, ThemeSwitch, SvgComponent, RouterLink, ClickOutsideDirective],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {
  readonly showDropdown = signal(false);

  readonly profileNavigation: NavLink = {
    link: '/dashboard/profile',
    text: 'Profile',
    icon: 'accountCircleIcon',
  };

  dropDownIcon: SvgNameType = 'arrowDropDownIcon';
  logoutIcon: SvgNameType = 'logoutIcon';
  logo: SvgNameType = 'logo';

  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  readonly user = this.usersService.currentUser;

  ngOnInit(): void {
    this.usersService.getProfile();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  toggleDropdown(): void {
    this.showDropdown.update(old => !old);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }
}
