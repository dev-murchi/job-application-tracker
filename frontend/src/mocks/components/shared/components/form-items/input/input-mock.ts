import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { InputElementBase } from '../../../../../../app/shared/components/form-helpers/input-element-base';

@Component({
  selector: 'app-input',
  template: '',
})
export class CustomInputMock {
  readonly form = input.required<FormGroup>();
  readonly inputElement = input.required<InputElementBase<any>>();
}
