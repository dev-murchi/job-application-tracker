import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../svg.config';
import { SvgComponent } from '../../svg/svg';

@Component({
  selector: 'app-submit-button',
  imports: [SvgComponent],
  templateUrl: './submit-button.html',
  styleUrl: './submit-button.css'
})
export class SubmitButton {
  icon = input<SvgNameType | undefined>(undefined);
  text = input<string>('');
  isDisabled = input<boolean>(false);
}
