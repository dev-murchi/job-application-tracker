import { Component, inject } from '@angular/core';

import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms'

import { AuthService } from '../../../../core/services/auth';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { UserRegisterData } from '../../services/auth-api';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  registerForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')
    ]),
    location: new FormControl('', Validators.required),
  });

  ngOnInit() {
    this.registerForm.reset();
  }

  registerUser() {
    if (this.registerForm.valid) {
      const payload: UserRegisterData = {
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
