import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

export interface NavLinkData { 
  text: string; 
  link: string; 
  icon: SvgNameType | undefined 
}

@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SvgComponent],
  templateUrl: './nav-link.html',
  styleUrls: ['./nav-link.css']
})
export class NavLink {
  link = input.required<string>();
  text = input<string | undefined>();
  icon = input<SvgNameType | undefined>();
  cssClass = input<string>('');
}
