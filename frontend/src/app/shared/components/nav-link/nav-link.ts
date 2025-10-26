import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SvgComponent],
  templateUrl: './nav-link.html',
  styleUrls: ['./nav-link.css'],
})
export class NavLink {
  readonly link = input.required<string>();
  readonly text = input<string | undefined>();
  readonly icon = input<SvgNameType | undefined>();
  readonly cssClass = input<string>('');
}
