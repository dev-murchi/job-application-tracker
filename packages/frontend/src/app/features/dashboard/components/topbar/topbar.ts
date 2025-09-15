import { Component, inject, Input } from '@angular/core';
import { NavLink } from '../../../../shared/components/nav-link/nav-link';
import { ThemeSwitch } from '../../../../shared/components/theme-switch/theme-switch';
import { Title } from '../../../../core/services/title';
import { filter } from 'rxjs';

@Component({
  selector: 'app-topbar',
  imports: [NavLink, ThemeSwitch],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  showDropdown=false;
  titleService = inject(Title);
  title: string = '';
  userProfile = {
    link: { target: '/dashboard/profile', text: 'Profile', icon: undefined },
    avatar: 'images/avatar.svg'
  }

  constructor() {
    this.titleService.title$.pipe(filter(title => !!title && typeof(title) === 'string')).subscribe((title) => {
      console.log({ title });
      this.title = title.trim();
    })
  }

}
