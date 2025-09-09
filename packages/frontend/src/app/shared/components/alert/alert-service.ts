import { Injectable, signal } from '@angular/core';

export interface Alert {
  id: string;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  readonly alerts = signal<Alert[]>([]);
  private autoHideTime = 3000;

  show(message: string, type: 'success' | 'error'): void {

    const newAlert: Alert = {
      id: crypto.randomUUID(),
      message,
      type
    };

    this.alerts.update(currentAlerts => [newAlert, ...currentAlerts]);

    setTimeout(() => {
      this.hide(newAlert.id);
    }, this.autoHideTime);
  }

  hide(id: string): void {
    this.alerts.update(currentAlerts => currentAlerts.filter(alert => alert.id !== id));
  }
}
