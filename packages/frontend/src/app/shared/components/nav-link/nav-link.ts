import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-link.html',
  styleUrls: ['./nav-link.css']
})
export class NavLink {
  link = input.required<string>();
  text = input<string | undefined>();
  icon = input<string | undefined>();
  cssClass = input<string>('');
}
