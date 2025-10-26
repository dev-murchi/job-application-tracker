import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgNameType } from '../../svg.config';
import { SvgComponent } from '../../shared/components/svg/svg';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, SvgComponent],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css',
})
export class NotFoundPage {
  logo: SvgNameType = 'logo';
  errorLogo: SvgNameType = 'error404';
}
