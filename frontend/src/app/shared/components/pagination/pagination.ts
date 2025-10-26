import { Component, computed, input, output } from '@angular/core';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-pagination',
  imports: [SvgComponent],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly requestedPage = output<number>();

  readonly prevActive = computed(() => this.currentPage() > 1);
  readonly nextActive = computed(() => this.currentPage() < this.totalPages());

  firstPageButtonIcon: SvgNameType = 'paginationFirstPageIcon';
  prevPageButtonIcon: SvgNameType = 'paginationPrevPageIcon';
  nextPageButtonIcon: SvgNameType = 'paginationNextPageIcon';
  lastPageButtonIcon: SvgNameType = 'paginationLastPageIcon';

  firstPageClick(): void {
    this.requestedPage.emit(1);
  }

  lastPageClick(): void {
    this.requestedPage.emit(this.totalPages());
  }

  prevPageClick(): void {
    if (this.currentPage() > 1) {
      this.requestedPage.emit(this.currentPage() - 1);
    }
  }

  nextPageClick(): void {
    if (this.currentPage() < this.totalPages()) {
      this.requestedPage.emit(this.currentPage() + 1);
    }
  }
}
