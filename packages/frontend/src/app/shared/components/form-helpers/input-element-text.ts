import { ValidatorFn } from "@angular/forms";
import { InputElementBase } from "./input-element-base";

export class InputElementText<T> extends InputElementBase<T> {
  constructor(options: {
    value: T;
    key: string;
    type: string;
    label?: string;
    placeholder?: string;
    validators?: ValidatorFn[];
  }) {
    super({ ...options, controlType: 'text' });
  }
}
