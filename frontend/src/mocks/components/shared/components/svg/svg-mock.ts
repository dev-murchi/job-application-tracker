import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../../app/svg.config';

@Component({
  selector: 'app-svg',
  template: '',
})
export class SvgComponentMock {
  svgName = input.required<SvgNameType>();
  mode = input<'icon' | 'image'>('icon');
  width = input<string>();
  height = input<string>();
  fill = input<string>();
  stroke = input<string>();
  class = input<string>('');
}
