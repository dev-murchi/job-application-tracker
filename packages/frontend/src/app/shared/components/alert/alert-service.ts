import { Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Alert } from '../../types/alert.data';


@Injectable({
  providedIn: 'root'
})
export class AlertService {
  readonly alerts = signal<Alert[]>([]);
  private autoHideTime = 3000;

  show(message: string, type: 'success' | 'error'): void {

    const newAlert: Alert = {
      id: uuidv4(),
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
