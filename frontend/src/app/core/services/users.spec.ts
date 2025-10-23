import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UsersService } from './users';
import { UserApi } from '../../api/user-api';

describe('UsersService', () => {
  let service: UsersService;
  let userApiSpy: jasmine.SpyObj<UserApi>;

  beforeEach(() => {
    userApiSpy = jasmine.createSpyObj('UserApi', ['updateUser']);

    TestBed.configureTestingModule({
      providers: [
        UsersService,
        { provide: UserApi, useValue: userApiSpy },
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
