import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: '',
})
export class PaginationMock {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  requestedPage = output<number>();
}
