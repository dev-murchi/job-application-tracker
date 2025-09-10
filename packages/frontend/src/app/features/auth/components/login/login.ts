import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserLoginData } from '../../services/auth-api';
import { AuthService } from '../../../../core/services/auth';
import { AlertService } from '../../../../shared/components/alert/alert-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.email]),
    password: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.loginForm.reset();
  }

  loginUser() {
    if(this.loginForm.valid) {
      const payload: UserLoginData = {
        email: this.loginForm.value.email!,
        password: this.loginForm.value.password!,
      };

      this.authService.login(payload).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.alertService.show('Login successful!', 'success');
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.alertService.show('Login failed. Please check your credentials', 'error');
        },
      });
    } else {
      console.log(this.loginForm);
      this.loginForm.markAllAsTouched();
    }
  }
}
