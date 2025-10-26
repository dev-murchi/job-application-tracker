import { Component, input } from '@angular/core';
import { NavLink } from '../../../../../app/shared/types/nav-link.data';

@Component({
  selector: 'app-mobile-navbar',
  template: '',
})
export class MobileNavbarMock {
  readonly items = input<NavLink[]>([]);
}
