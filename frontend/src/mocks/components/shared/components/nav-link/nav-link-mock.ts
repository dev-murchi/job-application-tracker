import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../../app/svg.config';

@Component({
  selector: 'app-nav-link',
  template: '',
})
export class NavLinkComponentMock {
  readonly link = input.required<string>();
  readonly text = input<string | undefined>();
  readonly icon = input<SvgNameType | undefined>();
  readonly cssClass = input<string>('');
}
