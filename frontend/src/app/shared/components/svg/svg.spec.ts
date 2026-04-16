import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SvgService } from '../../../core/services/svg-service';
import { SvgNameType } from '../../../svg.config';
import { SvgComponent } from './svg';

describe('SvgComponent', () => {
  let component: SvgComponent;
  let fixture: ComponentFixture<SvgComponent>;
  let svgServiceSpy: jasmine.SpyObj<SvgService>;

  const mockSvgName: SvgNameType = 'errorIcon';

  beforeEach(async () => {
    svgServiceSpy = jasmine.createSpyObj<SvgService>('SvgService', ['getSvg$']);
    svgServiceSpy.getSvg$.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [SvgComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SvgService, useValue: svgServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SvgComponent, { bindings: [] });
    component = fixture.componentInstance;
    fixture.componentRef.setInput('svgName', mockSvgName);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
