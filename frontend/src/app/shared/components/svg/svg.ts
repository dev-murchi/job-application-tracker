import { Component, effect, ElementRef, inject, input } from '@angular/core';
import { SvgService } from '../../../core/services/svg-service';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-svg',
  standalone: true,
  imports: [],
  template: '',
  styleUrl: './svg.css',
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.fill]': 'fill()',
    '[style.stroke]': 'stroke()',
  },
})
export class SvgComponent {
  readonly svgName = input.required<SvgNameType>();
  readonly mode = input<'icon' | 'image'>('icon');
  readonly width = input<string>();
  readonly height = input<string>();
  readonly fill = input<string>();
  readonly stroke = input<string>();

  private readonly svgService = inject(SvgService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(onCleanup => {
      const svgName = this.svgName();
      const svgMode = this.mode();

      const sub = this.svgService.getSvg$(svgName).subscribe(svgText => {
        this.renderSvg(svgText, svgMode);
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  private renderSvg(svgText: string | null, mode: 'icon' | 'image'): void {
    if (!svgText) {
      this.elementRef.nativeElement.innerHTML = '';
      return;
    }

    let svgData = svgText;

    // Remove any hardcoded fill attributes for icons.
    if (mode === 'icon') {
      svgData = svgData.replace(/ fill="[^"]*"/g, '');
    }

    // Ensure the SVG isn't focusable (prevents accidental tab stops in some browsers).
    svgData = svgData.replace(/\s+focusable=(?:"[^"]*"|'[^']*')/gi, '');
    svgData = svgData.replace(/<svg\b/i, '<svg focusable="false"');

    this.elementRef.nativeElement.innerHTML = svgData;
  }
}
