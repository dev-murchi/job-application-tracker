import { Component, input } from '@angular/core';
import { NavLink as NavLinkComponent } from '../nav-link/nav-link';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';
import { NavLink } from '../../types/nav-link.data';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NavLinkComponent, SvgComponent],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar {
  readonly items = input<NavLink[]>([]);

  isCollapsed = false;

  panelCloseIcon: SvgNameType = 'leftPanelCloseIcon';
  panelOpenIcon: SvgNameType = 'leftPanelOpenIcon';

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
