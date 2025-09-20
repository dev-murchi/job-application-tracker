import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';

@Component({
  selector: 'app-user-profile',
  imports: [ReactiveFormsModule, SvgComponent],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent {
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);

  editIcon: SvgNameType = 'editIcon';
  sendIcon: SvgNameType = 'sendIcon';
  cancelIcon: SvgNameType = 'cancelIcon';

  editMode = signal<boolean>(false);

  readonly currentUser = this.usersService.currentUser;

  readonly profileForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    location: new FormControl('', Validators.required),
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

    this.disableForm();
    this.usersService.updateProfile(payload).subscribe({
      next: () => {
        this.profileForm.markAsPristine();
        this.profileForm.markAsUntouched();
      },
      error: (err) => {
        this.enableForm();
      },
    });
  }

  enableForm() {
    this.editMode.set(true);
    this.profileForm.enable();
  }

  disableForm() {
    this.editMode.set(false);
    this.profileForm.disable();
  }

  resetForm(event: Event) {
    const user = this.currentUser();
    if (user) {
      this.patchFormWithUser(user);
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      this.disableForm();
    }
  }
}
