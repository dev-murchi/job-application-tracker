import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../../../app/svg.config';

@Component({
  selector: 'app-submit-button',
  template: '',
})
export class SubmitButtonMock {
  icon = input<SvgNameType | undefined>(undefined);
  text = input<string>('');
  isDisabled = input<boolean>(false);
}
