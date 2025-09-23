import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";

type ProfileForm = FormGroup<{
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  email: FormControl<string | null>;
  location: FormControl<string | null>;
}>;

@Component({
  selector: 'app-user-profile',
  imports: [ReactiveFormsModule, SvgComponent, CustomInput, SubmitButton],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent {
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);

  editIcon: SvgNameType = 'editIcon';
  sendIcon: SvgNameType = 'sendIcon';
  cancelIcon: SvgNameType = 'cancelIcon';
  readonly defaultAvatar = 'images/default-avatar.png';

  editMode = signal<boolean>(false);

  readonly currentUser = this.usersService.currentUser;

  firstNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  lastNameControl = new FormControl('', Validators.required);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  locationControl = new FormControl('', Validators.required);

  readonly profileForm : ProfileForm = new FormGroup({
    firstName: this.firstNameControl,
    lastName: this.lastNameControl,
    email: this.emailControl,
    location: this.locationControl,
  });


  constructor() {
    this.disableForm();
    effect(() => {
      const user = this.usersService.currentUser();
      if (user) {
        this.patchFormWithUser(user);
      }
    });
  }

  private patchFormWithUser(user: any) {
    this.profileForm.patchValue({
      firstName: user.name ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      location: user.location ?? '',
    });
  }

  updateProfile(): void {

    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      this.alertService.show('Please fix the errors in the form before updating.', 'error');
      return;
    }

    if (this.profileForm.pristine) {
      this.alertService.show('No changes detected.', 'warn');
      return;
    }

    const payload = {
      name: this.profileForm.value.firstName!,
      lastName: this.profileForm.value.lastName!,
      email: this.profileForm.value.email!,
      location: this.profileForm.value.location!,
    };

    this.profileForm.disable();
    this.usersService.updateProfile(payload).subscribe({
      next: () => {
        this.editMode.set(false);
        this.profileForm.markAsPristine();
        this.profileForm.markAsUntouched();
      },
      error: (err) => {
        this.profileForm.enable()
      },
    });
  }

  editForm() {
    this.editMode.set(true);
    this.profileForm.enable();
  }

  disableForm() {
    this.editMode.set(false);
    this.profileForm.disable();
  }

  resetForm(event: Event) {
    event.preventDefault();
    const user = this.currentUser();
    if (user) {
      this.patchFormWithUser(user);
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      this.disableForm();
    }
  }
}
