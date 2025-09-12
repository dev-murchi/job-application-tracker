import { TestBed } from '@angular/core/testing';

import { Title } from './title';

describe('Title', () => {
  let service: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Title);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
