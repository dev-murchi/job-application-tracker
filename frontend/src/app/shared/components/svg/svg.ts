import { Component, effect, inject, input, ElementRef, HostBinding } from '@angular/core';
import { SvgNameType } from '../../../svg.config';
import { SvgService } from '../../../core/services/svg-service';

@Component({
  selector: 'app-svg',
  standalone: true,
  imports: [],
  template: '',
  styleUrl: './svg.css'
})
export class SvgComponent {

  svgName = input.required<SvgNameType>();
  mode = input<'icon' | 'image'>('icon');
  width = input<string>();
  height = input<string>();
  fill = input<string>();
  stroke = input<string>();
  class = input<string>('');

  @HostBinding('class')
  get customClass(): string {
    return this.class();
  }

  @HostBinding('style.width')
  get hostWidth(): string | undefined {
    return this.width();
  }

  @HostBinding('style.height')
  get hostHeight(): string | undefined {
    return this.height();
  }

  @HostBinding('style.fill')
  get hostFill(): string | undefined {
    return this.fill();
  }

  @HostBinding('style.stroke')
  get hostStroke(): string | undefined {
    return this.stroke();
  }

  private svgService = inject(SvgService);
  private elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const svgName = this.svgName();
      const svgMode = this.mode();
      if (svgName) {
        let svgData = this.svgService.getSvg(svgName);
        if (svgData) {
          // Remove any hardcoded fill attributes for icons
          if (svgMode === 'icon') {
            svgData = svgData.replace(/ fill="[^"]*"/g, '');
          }
          this.elementRef.nativeElement.innerHTML = svgData;
        } else {
          this.elementRef.nativeElement.innerHTML = '';
        }
      }
    });
  }
}
