import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from './alert-service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css'
})
export class Alert {
  private alertService = inject(AlertService);

  alerts = this.alertService.alerts;

  hideAlert(id: string): void {
    this.alertService.hide(id);
  }
}