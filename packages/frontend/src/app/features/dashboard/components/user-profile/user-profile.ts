import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserProfile } from '../../../../shared/types/user-profile.data';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users';
import { AlertService } from '../../../../shared/components/alert/alert-service';

@Component({
  selector: 'app-user-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);
  private profileSub?: ReturnType<Observable<any>["subscribe"]>;

  readonly profileForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    location: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    this.profileSub = this.usersService.getProfile()
      .pipe(
        filter((profile: UserProfile | null): profile is UserProfile => !!profile)
      )
      .subscribe({
        next: (profile: UserProfile) => {
          this.profileForm.patchValue({
            firstName: profile.name ?? '',
            lastName: profile.lastName ?? '',
            email: profile.email ?? '',
            location: profile.location ?? ''
          });
        },
        error: () => {
          this.alertService.show('Failed to load profile.', 'error');
        }
      });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
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
        this.profileForm.markAsPristine();
        this.profileForm.enable();
      },
      error: (err) => {
        this.profileForm.enable();
      },
    });
  }
}
