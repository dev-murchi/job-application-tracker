import { Component, computed, input, output } from '@angular/core';
import { SvgComponent } from '../svg/svg';
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-pagination',
  imports: [SvgComponent],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  requestedPage = output<number>();

  prevActive = computed(() => this.currentPage() > 1);
  nextActive = computed(() => this.currentPage() < this.totalPages());

  firstPageButtonIcon: SvgNameType = 'paginationFirstPageIcon';
  prevPageButtonIcon: SvgNameType = 'paginationPrevPageIcon';
  nextPageButtonIcon: SvgNameType = 'paginationNextPageIcon';
  lastPageButtonIcon: SvgNameType = 'paginationLastPageIcon';

  firstPageClick() {
    this.requestedPage.emit(1);
  }

  lastPageClick() {
    this.requestedPage.emit(this.totalPages());
  }

  prevPageClick() {
    if (this.currentPage() > 1) {
      this.requestedPage.emit(this.currentPage() - 1);
    } 
  }

  nextPageClick() {
    if (this.currentPage() < this.totalPages()) {
      this.requestedPage.emit(this.currentPage() + 1);
    }
  }
}
