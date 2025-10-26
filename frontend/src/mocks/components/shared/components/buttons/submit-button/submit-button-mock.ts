import { Component, input } from '@angular/core';
import { SvgNameType } from '../../../../../../app/svg.config';

@Component({
  selector: 'app-submit-button',
  template: '',
})
export class SubmitButtonMock {
  readonly icon = input<SvgNameType | undefined>(undefined);
  readonly text = input<string>('');
  readonly isDisabled = input<boolean>(false);
}
