import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../../../core/services/users';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { SubmitButton } from "../../../../shared/components/buttons/submit-button/submit-button";
import { InputControlService } from '../../../../shared/components/form-helpers/input-control-service';
import { InputElementText } from '../../../../shared/components/form-helpers/input-element-text';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { LoadingSpinner } from "../../../../shared/components/loading-spinner/loading-spinner";

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, ReactiveFormsModule, SvgComponent, CustomInput, SubmitButton, LoadingSpinner],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);

  readonly defaultAvatar = 'images/default-avatar.png';
  readonly accountIcon: SvgNameType = 'accountCircleIcon';
  readonly locationIcon: SvgNameType = 'locationIcon';
  readonly editIcon: SvgNameType = 'editIcon';
  readonly warningIcon: SvgNameType = 'warningIcon';
  readonly cancelIcon: SvgNameType = 'cancelIcon';
  readonly sendIcon: SvgNameType = 'sendIcon';

  readonly firstNameIput = new InputElementText({
    value: '',
    key: 'firstNameControl',
    label: 'First Name',
    type: 'text',
    placeholder: 'John',
    validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
  });
  readonly lastNameIput = new InputElementText({
    value: '',
    key: 'lastNameControl',
    label: 'Last Name',
    type: 'text',
    placeholder: 'Doe',
    validators: [Validators.required, Validators.maxLength(20)]
  });
  readonly emailInput = new InputElementText({
    value: '',
    key: 'emailControl',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your@email.com',
    validators: [Validators.required, Validators.email]
  });
  readonly locationIput = new InputElementText({
    value: '',
    key: 'locationControl',
    label: 'Location',
    type: 'text',
    placeholder: 'San Francisco, CA',
    validators: [Validators.required, Validators.maxLength(20)]
  });
  readonly currentUser = this.usersService.currentUser;

  readonly profileForm: FormGroup;
  editMode = signal<boolean>(false);

  constructor() {
    const ics = inject(InputControlService);
    this.profileForm = new FormGroup({
      [`${this.firstNameIput.key}`]: ics.toFormControl(this.firstNameIput),
      [`${this.lastNameIput.key}`]: ics.toFormControl(this.lastNameIput),
      [`${this.emailInput.key}`]: ics.toFormControl(this.emailInput),
      [`${this.locationIput.key}`]: ics.toFormControl(this.locationIput),
    })

    this.profileForm.disable();

    effect(() => {
      const user = this.currentUser();

      if (user.error) {
        this.alertService.show('Failed to update profile.', 'error');
      }

      if (user.profile && !user.error) {
        this.patchFormWithUser(user.profile);
        this.profileForm.markAsPristine();
        this.profileForm.markAsUntouched();
      }

      if (user.isUpdated) {
        this.disableFormEditing();
        this.alertService.show('Profile updated successfully!', 'success');
      }
    });
  }

  ngOnInit() {
    this.usersService.getProfile();
  }

  updateProfile(): void {

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.alertService.show('Please fix the errors in the form before updating.', 'error');
      return;
    }

    if (this.profileForm.pristine) {
      this.alertService.show('No changes detected.', 'warn');
      return;
    }

    const payload = {
      name: this.profileForm.value[this.firstNameIput.key]!,
      lastName: this.profileForm.value[this.lastNameIput.key]!,
      email: this.profileForm.value[this.emailInput.key]!,
      location: this.profileForm.value[this.locationIput.key]!,
    };

    this.usersService.updateProfile(payload);
  }

  enableFormEditing() {
    this.editMode.set(true);
    this.profileForm.enable();
  }

  disableFormEditing() {
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
      this.disableFormEditing();
    }
  }

  private patchFormWithUser(user: any) {
    this.profileForm.patchValue({
      [`${this.firstNameIput.key}`]: user.name ?? '',
      [`${this.lastNameIput.key}`]: user.lastName ?? '',
      [`${this.emailInput.key}`]: user.email ?? '',
      [`${this.locationIput.key}`]: user.location ?? '',
    });
  }
}