import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  imports: [ReactiveFormsModule],
  templateUrl: './input.html',
  styleUrl: './input.css'
})
export class CustomInput {

  label = input<string>('label');
  type = input<string>('text');
  inputId = input<string>(`id-${Date.now()}`);
  control = input<FormControl<any>>()
  placeholder = input<string>('');

  errorOccured = signal(false);

  ngOnInit() {
    const ctrl = this.control();
    if (ctrl) {
      this.errorOccured.set(ctrl.invalid && ctrl.dirty);
      ctrl.valueChanges.subscribe(() => {
        this.errorOccured.set(ctrl.invalid && ctrl.dirty);
      });
    }
  }
}
