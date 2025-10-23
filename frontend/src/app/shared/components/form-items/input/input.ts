import { Component, input, signal } from '@angular/core';
import {  FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputElementBase } from '../../form-helpers/input-element-base';

@Component({
  selector: 'app-input',
  imports: [ReactiveFormsModule],
  templateUrl: './input.html',
  styleUrl: './input.css'
})
export class CustomInput {

  errorOccured = signal(false);

  readonly form = input.required<FormGroup>();
  readonly inputElement = input.required<InputElementBase<any>>();

  ngOnInit() {
    const ctrl = this.form().get(this.inputElement().key);
    if (ctrl) {
      this.errorOccured.set(ctrl.invalid && ctrl.dirty);
      ctrl.valueChanges.subscribe(() => {
        this.errorOccured.set(ctrl.invalid && ctrl.dirty);
      });
    }
  }
}
