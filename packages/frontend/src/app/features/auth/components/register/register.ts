import { Component, inject } from '@angular/core';

import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { AuthService } from '../../../../core/services/auth';
import { UserRegister } from '../../../../shared/types/user-register.data';
import { SvgNameType } from '../../../../svg.config';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";
import { InputElementText } from '../../../../shared/components/form-helpers/input-element-text';
import { InputControlService } from '../../../../shared/components/form-helpers/input-control-service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CustomInput, SubmitButton],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(AuthService);

  firstNameIput = new InputElementText({
    value: '',
    key: 'firstNameControl',
    label: 'First Name',
    type: 'text',
    order: 1,
    placeholder: 'first name',
    validators: [Validators.required, Validators.minLength(3)]
  });

  lastNameIput = new InputElementText({
    value: '',
    key: 'lastNameControl',
    label: 'Last Name',
    type: 'text',
    order: 2,
    placeholder: 'last name',
    validators: [Validators.required]
  });

  emailInput = new InputElementText({
    value: '',
    key: 'registerEmailControl',
    label: 'Email',
    type: 'email',
    order: 3,
    placeholder: 'you@email.com',
    validators: [Validators.required, Validators.email]
  })

  passwordInput = new InputElementText({
    value: '',
    key: 'registerPasswordControl',
    label: 'Password',
    type: 'password',
    order: 4,
    placeholder: '********',
    validators: [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')]
  })

  locationIput = new InputElementText({
    value: '',
    key: 'locationControl',
    label: 'Location',
    type: 'text',
    order: 5,
    placeholder: 'Tx, USB',
    validators: [Validators.required]
  });

  readonly registerForm: FormGroup;
  registerIcon: SvgNameType = 'registerIcon';

  constructor() {
    const ics = inject(InputControlService);

    this.registerForm = new FormGroup({
      [`${this.firstNameIput.key}`]: ics.toFormControl(this.firstNameIput),
      [`${this.lastNameIput.key}`]: ics.toFormControl(this.lastNameIput),
      [`${this.emailInput.key}`]: ics.toFormControl(this.emailInput),
      [`${this.passwordInput.key}`]: ics.toFormControl(this.passwordInput),
      [`${this.locationIput.key}`]: ics.toFormControl(this.locationIput),
    });
  }

  ngOnInit() {
    this.registerForm.reset();
  }

  registerUser() {
    if (this.registerForm.valid) {
      const payload: UserRegister = {
        name: this.registerForm.value[this.firstNameIput.key]!,
        lastName: this.registerForm.value[this.lastNameIput.key]!,
        email: this.registerForm.value[this.emailInput.key]!,
        password: this.registerForm.value[this.passwordInput.key]!,
        location: this.registerForm.value[this.locationIput.key]!,
      }

      this.authService.register(payload).subscribe();
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
