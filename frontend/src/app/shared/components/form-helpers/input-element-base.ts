import { ValidatorFn } from '@angular/forms';

export class InputElementBase<T> {
  controlType: string;
  value: T | undefined;
  key: string;
  type: string;
  label: string;
  options: { key: string; value: string }[];
  placeholder?: string;
  validators?: ValidatorFn[];
  debounceTime?: number;

  constructor(options: {
    controlType: string;
    value: T;
    type: string;
    key: string;
    label?: string;
    options?: { key: string; value: string }[];
    placeholder?: string;
    validators?: ValidatorFn[];
  }) {
    this.controlType = options.controlType;
    this.key = options.key;
    this.value = options.value;
    this.type = options.type;
    this.label = options.label || '';
    this.options = options.options || [];
    this.placeholder = options.placeholder || '';
    this.validators = options.validators || [];
  }
}
