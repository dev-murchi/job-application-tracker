import { Component, inject } from '@angular/core';
import { ThemeSwitch } from '../../../../shared/components/theme-switch/theme-switch';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { AuthService } from '../../../../core/services/auth';
import { NavLink } from '../../../../shared/types/nav-link.data';
import { NavLink as NavLinkComponent } from '../../../../shared/components/nav-link/nav-link';
import { UserProfile } from '../../../../shared/types/user-profile.data';

@Component({
  selector: 'app-topbar',
  imports: [NavLinkComponent, ThemeSwitch, SvgComponent],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  showDropdown = false

  readonly profileNavigtion: NavLink = { 
    link: '/dashboard/profile', 
    text: 'Profile', 
    icon: 'accountCircleIcon' 
  };

  readonly userProfile: UserProfile = {
    avatar: 'images/avatar-2.jpg',
    name: 'User John Doe'
  };

  dropDownIcon: SvgNameType = 'arrowDropDownIcon';
  logoutIcon: SvgNameType = 'logoutIcon';
  logo: SvgNameType = 'logo';

  private readonly authService = inject(AuthService);

  logout() {
    this.authService.logout().subscribe();
  }
}
