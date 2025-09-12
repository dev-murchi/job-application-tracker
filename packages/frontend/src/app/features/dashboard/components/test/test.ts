import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '../../../../core/services/title';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  titleService = inject(Title);
  route = inject(ActivatedRoute);
  constructor() {
    this.titleService.setTitle(this.route.snapshot.data['title'] ?? 'Test Title')
  }
}
