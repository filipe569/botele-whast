
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  WAITING_CODE = 'WAITING_CODE',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface LogMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'media';
}
