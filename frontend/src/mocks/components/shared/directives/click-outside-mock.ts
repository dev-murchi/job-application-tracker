import { Directive, output } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
})
export class ClickOutsideDirectiveMock {
  clickOutside = output<void>();
}
