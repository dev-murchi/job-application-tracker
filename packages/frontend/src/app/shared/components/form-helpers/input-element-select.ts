import { ValidatorFn } from "@angular/forms";
import { InputElementBase } from "./input-element-base";

export class InputElementSelect<T> extends InputElementBase<T> {
  constructor(options: {
    value: T;
    key: string;
    type: string;
    label?: string;
    order?: number;
    options?: { key: string; value: string }[];
    placeholder?: string;
    validators?: ValidatorFn[];
  }) {
    super({ ...options, controlType: 'select' })
  }
}
