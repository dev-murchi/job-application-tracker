import { Component, inject } from '@angular/core';

import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms'

import { AuthService } from '../../../../core/services/auth';
import { UserRegister } from '../../../../shared/types/user-register.data';
import { SvgNameType } from '../../../../svg.config';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CustomInput, SubmitButton],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(AuthService);

  firstNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  lastNameControl = new FormControl('', Validators.required);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'),
    
  ]);
  locationControl = new FormControl('', Validators.required);

  registerForm = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    password: this.passwordControl,
    location: this.locationControl,
  });

  registerIcon: SvgNameType = 'registerIcon';

  ngOnInit() {
    this.registerForm.reset();
  }

  registerUser() {
    if (this.registerForm.valid) {
      const payload: UserRegister = {
        name: this.registerForm.value.firstName!,
        lastName: this.registerForm.value.lastName!,
        email: this.registerForm.value.email!,
        password: this.registerForm.value.password!,
        location: this.registerForm.value.location!,
      }

      this.authService.register(payload).subscribe();
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
