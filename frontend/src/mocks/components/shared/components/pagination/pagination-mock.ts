import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: '',
})
export class PaginationMock {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly requestedPage = output<number>();
}
