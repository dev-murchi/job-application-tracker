import { Component, input } from '@angular/core';
import { NavLink } from '../../../../../app/shared/types/nav-link.data';

@Component({
  selector: 'app-sidebar',
  template: '',
})
export class SidebarMock {
  readonly items = input<NavLink[]>([]);
}
