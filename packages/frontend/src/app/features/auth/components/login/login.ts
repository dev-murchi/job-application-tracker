import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserLogin } from '../../../../shared/types/user-login.data';
import { AuthService } from '../../../../core/services/auth';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, SvgComponent, CustomInput, SubmitButton],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  loginIcon: SvgNameType = 'loginIcon';
  demoIcon: SvgNameType = 'demoIcon';

  emailControl = new FormControl('', [Validators.email]);
  passwordControl = new FormControl('', Validators.required);

  loginForm = new FormGroup({
    email: this.emailControl,
    password:this.passwordControl,
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
    const demoUserPayload: UserLogin = {
      email: 'test@user.com',
      password: 'TestPass.123'
    };

    this.authService.login(demoUserPayload).subscribe();
  }
}
