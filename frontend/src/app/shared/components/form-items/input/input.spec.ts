import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomInput } from './input';
import { FormControl, FormGroup } from '@angular/forms';
import { InputElementBase } from '../../form-helpers/input-element-base';

describe('CustomInput', () => {
  let component: CustomInput;
  let fixture: ComponentFixture<CustomInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomInput],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomInput);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'form',
      new FormGroup({
        testKey: new FormControl(''),
      }),
    );
    fixture.componentRef.setInput(
      'inputElement',
      new InputElementBase({ controlType: 'input', value: '', key: 'testKey', type: 'text' }),
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
