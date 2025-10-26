import { Directive, output } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
})
export class ClickOutsideDirectiveMock {
  readonly clickOutside = output<void>();
}
