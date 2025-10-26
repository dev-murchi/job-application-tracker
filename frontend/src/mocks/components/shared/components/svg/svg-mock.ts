import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../../app/svg.config';

@Component({
  selector: 'app-svg',
  template: '',
})
export class SvgComponentMock {
  readonly svgName = input.required<SvgNameType>();
  readonly mode = input<'icon' | 'image'>('icon');
  readonly width = input<string>();
  readonly height = input<string>();
  readonly fill = input<string>();
  readonly stroke = input<string>();
  readonly class = input<string>('');
}
