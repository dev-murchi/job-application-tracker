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
  required = input<boolean>(true);
  control = input<FormControl<any>>()
  placeholder = input<string>('');

  errorOccured = signal(false);

  ngOnInit() {
    const ctrl = this.control();
    if (ctrl) {
      ctrl.valueChanges.subscribe(() => {
        const { invalid, dirty, touched } = ctrl
        this.errorOccured.set(invalid && (dirty || touched));
      });
    }
  }
}
