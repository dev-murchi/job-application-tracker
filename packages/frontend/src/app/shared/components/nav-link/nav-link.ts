import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-link.html',
  styleUrls: ['./nav-link.css']
})
export class NavLink {
  @Input() link = '/';
  @Input() icon = '';
  @Input() text = '';
}
