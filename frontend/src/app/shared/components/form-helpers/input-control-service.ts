import { Injectable } from '@angular/core';
import { InputElementBase } from './input-element-base';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class InputControlService {

  toFormControl<T>(inputElement: InputElementBase<T>) {
    const validators = inputElement.validators ?? [];
    const initialValue = inputElement.value || '';  // use empty string as fallback value
    return new FormControl(initialValue, { validators, nonNullable: true });
  }
}
