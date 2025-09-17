import { Component } from '@angular/core';
import { NavLink, NavLinkData } from '../../../../shared/components/nav-link/nav-link';
import { ThemeSwitch } from '../../../../shared/components/theme-switch/theme-switch';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';

interface UserProfile {
  link: NavLinkData;
  avatar: string;
  name: string;
}

@Component({
  selector: 'app-topbar',
  imports: [NavLink, ThemeSwitch, SvgComponent],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  showDropdown=false;
  title: string = '';
  userProfile: UserProfile = {
    link: { link: '/dashboard/profile', text: 'Profile', icon: 'accountCircleIcon' },
    avatar: 'images/avatar-2.jpg',
    name: 'User John Doe'
  }

  dropDownIcon: SvgNameType= 'arrowDropDownIcon';
  logoutIcon: SvgNameType= 'logoutIcon';
  logo: SvgNameType= 'logo';

}
