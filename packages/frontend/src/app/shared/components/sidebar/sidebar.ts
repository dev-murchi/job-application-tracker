import { Component, Input } from '@angular/core';
import { NavLink, NavLinkData } from '../nav-link/nav-link';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ NavLink, SvgComponent],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() items: Array<NavLinkData> = [];

  isCollapsed = false;

  panelCloseIcon: SvgNameType = 'leftPanelCloseIcon';
  panelOpenIcon: SvgNameType = 'leftPanelOpenIcon';


  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }
}
