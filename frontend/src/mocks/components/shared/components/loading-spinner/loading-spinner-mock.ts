import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: '',
})
export class LoadingSpinnerMock {
  readonly text = input<string>();
}
