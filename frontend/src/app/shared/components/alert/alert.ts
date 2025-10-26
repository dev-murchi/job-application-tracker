import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from './alert-service';
import { SvgNameType } from '../../../svg.config';
import { SvgComponent } from '../svg/svg';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, SvgComponent],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class Alert {
  private alertService = inject(AlertService);

  alerts = this.alertService.alerts;

  successIcon: SvgNameType = 'checkCircleIcon';
  errorIcon: SvgNameType = 'errorIcon';
  closeIcon: SvgNameType = 'closeIcon';

  hideAlert(id: string): void {
    this.alertService.hide(id);
  }
}
