import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NavLink } from '../nav-link/nav-link';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ NavLink],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() items: Array<{ text: string; link: string; icon: string }> = [];
}
