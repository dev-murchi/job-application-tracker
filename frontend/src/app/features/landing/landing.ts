import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgNameType } from '../../svg.config';
import { SvgComponent } from '../../shared/components/svg/svg';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, SvgComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {
  logo: SvgNameType = 'logo';
  landingPageLogo: SvgNameType = 'landingPageLogo'
}
