import { Component, inject } from '@angular/core';
import { ThemeSwitch } from '../../../../shared/components/theme-switch/theme-switch';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { AuthService } from '../../../../core/services/auth';
import { UsersService } from '../../../../core/services/users';
import { NavLink } from '../../../../shared/types/nav-link.data';
import { NavLink as NavLinkComponent } from '../../../../shared/components/nav-link/nav-link';

@Component({
  selector: 'app-topbar',
  imports: [NavLinkComponent, ThemeSwitch, SvgComponent],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  showDropdown = false;

  readonly profileNavigtion: NavLink = { 
    link: '/dashboard/profile', 
    text: 'Profile', 
    icon: 'accountCircleIcon' 
  };

  dropDownIcon: SvgNameType = 'arrowDropDownIcon';
  logoutIcon: SvgNameType = 'logoutIcon';
  logo: SvgNameType = 'logo';

  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  readonly userProfile = this.usersService.currentUser;

  logout() {
    this.authService.logout().subscribe();
  }
}
