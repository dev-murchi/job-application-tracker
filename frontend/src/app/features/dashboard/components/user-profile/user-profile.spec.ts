import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileComponent } from './user-profile';
import { UsersService } from '../../../../core/services/users';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { SubmitButtonMock } from '../../../../../mocks/components/shared/components/buttons/submit-button/submit-button-mock';
import { CustomInputMock } from '../../../../../mocks/components/shared/components/form-items/input/input-mock';
import { LoadingSpinnerMock } from '../../../../../mocks/components/shared/components/loading-spinner/loading-spinner-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { SubmitButton } from '../../../../shared/components/buttons/submit-button/submit-button';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { SvgComponent } from '../../../../shared/components/svg/svg';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    const currentUserSignal = signal({
      profile: null,
      isLoading: true,
      isUpdated: false,
      error: null,
    });
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getProfile', 'updateProfile'], {
      currentUser: currentUserSignal,
    });
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['show']);

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
      ],
    })
      .overrideComponent(UserProfileComponent, {
        remove: { imports: [SvgComponent, CustomInput, SubmitButton, LoadingSpinner] },
        add: {
          imports: [SvgComponentMock, CustomInputMock, SubmitButtonMock, LoadingSpinnerMock],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
