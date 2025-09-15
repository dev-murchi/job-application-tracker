import { Component, Input } from '@angular/core';
import { ThemeSwitch } from '../theme-switch/theme-switch';
import { NavLink } from '../nav-link/nav-link';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ThemeSwitch, NavLink],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() items: Array<{ text: string; link: string; icon: string }> = [];

  isCollapsed = false;

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }
}
