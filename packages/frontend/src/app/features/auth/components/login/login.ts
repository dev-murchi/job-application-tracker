import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";
import { InputControlService } from '../../../../shared/components/form-helpers/input-control-service';
import { InputElementText } from '../../../../shared/components/form-helpers/input-element-text';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { UserLogin } from '../../../../shared/types/user-login.data';
import { SvgNameType } from '../../../../svg.config';

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

  readonly loginForm: FormGroup;

  emailInput = new InputElementText({
    value: '',
    key: 'loginEmailControl',
    label: 'Email',
    type: 'email',
    placeholder: 'you@email.com',
    validators: [Validators.required, Validators.email]
  })

  passwordInput = new InputElementText({
    value: '',
    key: 'loginPasswordControl',
    label: 'Password',
    type: 'password',
    placeholder: '********',
    validators: [Validators.required]
  })

  constructor() {
    const ics = inject(InputControlService);

    this.loginForm = new FormGroup({
      [`${this.emailInput.key}`]: ics.toFormControl(this.emailInput),
      [`${this.passwordInput.key}`]: ics.toFormControl(this.passwordInput),
    })

    this.loginForm.valueChanges.subscribe(val => {
      console.log({form: this.loginForm, invalid: this.loginForm.invalid})
    })
  }

  ngOnInit(): void {
    this.loginForm.reset();
  }

  loginUser() {
    if (this.loginForm.valid) {
      const payload: UserLogin = {
        email: this.loginForm.value[this.emailInput.key]!,
        password: this.loginForm.value[this.passwordInput.key]!,
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
