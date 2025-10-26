import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ClickOutsideDirective } from './click-outside';

@Component({
  template: `<div clickOutside (clickOutside)="onClickOutside()">Test Content</div>`,
  standalone: true,
  imports: [ClickOutsideDirective],
})
class TestComponent {
  clicked = false;
  onClickOutside(): void {
    this.clicked = true;
  }
}

describe('ClickOutsideDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let divElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent, ClickOutsideDirective],
      providers: [provideZonelessChangeDetection()],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    divElement = fixture.debugElement.query(By.css('div'));
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(divElement).toBeTruthy();
  });

  it('should emit clickOutside when clicking outside element', () => {
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    outsideElement.click();

    expect(component.clicked).toBe(true);

    document.body.removeChild(outsideElement);
  });

  it('should not emit clickOutside when clicking inside element', () => {
    divElement.nativeElement.click();

    expect(component.clicked).toBe(false);
  });
});
