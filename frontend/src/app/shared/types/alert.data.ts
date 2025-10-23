export type AlertType = 'success' | 'error' | 'warn';

export interface Alert {
  id: string;
  message: string;
  type: AlertType;
}
