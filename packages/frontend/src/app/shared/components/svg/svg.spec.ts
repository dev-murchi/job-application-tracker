import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SvgComponent } from './svg';
import { SvgService } from '../../../core/services/svg-service';
import { SvgNameType } from '../../../svg.config';

describe('SvgComponent', () => {
  let component: SvgComponent;
  let fixture: ComponentFixture<SvgComponent>;
  let svgServiceSpy: jasmine.SpyObj<SvgService>;
  const mockSvgName: SvgNameType = 'errorIcon';

  beforeEach(async () => {
    svgServiceSpy = jasmine.createSpyObj('SvgService', ['getSvg']);

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
