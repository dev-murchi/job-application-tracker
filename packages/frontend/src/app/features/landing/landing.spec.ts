import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { Landing } from './landing';
import { provideRouter } from '@angular/router';
import { SvgComponentMock } from '../../../mocks/components/shared/components/svg/svg-mock';
import { SvgComponent } from '../../shared/components/svg/svg';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    })
      .overrideComponent(Landing, {
        remove: { imports: [SvgComponent] },
        add: { imports: [SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
