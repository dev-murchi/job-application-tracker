import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../../app/svg.config';

@Component({
  selector: 'app-nav-link',
  template: '',
})
export class NavLinkComponentMock {
  link = input.required<string>();
  text = input<string | undefined>();
  icon = input<SvgNameType | undefined>();
  cssClass = input<string>('');
}
