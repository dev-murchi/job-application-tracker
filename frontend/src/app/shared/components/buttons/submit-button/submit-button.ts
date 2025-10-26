import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../svg.config';
import { SvgComponent } from '../../svg/svg';

@Component({
  selector: 'app-submit-button',
  imports: [SvgComponent],
  templateUrl: './submit-button.html',
  styleUrl: './submit-button.css',
})
export class SubmitButton {
  readonly icon = input<SvgNameType | undefined>(undefined);
  readonly text = input<string>('');
  readonly isDisabled = input<boolean>(false);
}
