import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserLogin } from '../../../../shared/types/user-login.data';
import { AuthService } from '../../../../core/services/auth';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, SvgComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  loginIcon: SvgNameType = 'loginIcon';
  demoIcon: SvgNameType = 'demoIcon';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.email]),
    password: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.loginForm.reset();
  }

  loginUser() {
    if (this.loginForm.valid) {
      const payload: UserLogin = {
        email: this.loginForm.value.email!,
        password: this.loginForm.value.password!,
      };

      this.authService.login(payload).subscribe();
    } else {
      console.log(this.loginForm);
      this.loginForm.markAllAsTouched();
    }
  }

  demoLogin(event: Event) {
    event.preventDefault();
  }
}
