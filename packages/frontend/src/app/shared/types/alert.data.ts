type AlertType = 'success' | 'error';

export interface Alert {
  id: string;
  message: string;
  type: AlertType;
}
