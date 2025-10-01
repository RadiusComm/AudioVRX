import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect() {
    if (this.socket) return;

    const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (!websocketUrl) {
      console.error('WebSocket URL not configured');
      return;
    }

    this.socket = io(websocketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle incoming messages
    this.socket.on('message', (data) => {
      const handler = this.messageHandlers.get(data.type);
      if (handler) {
        handler(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  off(type: string) {
    this.messageHandlers.delete(type);
  }

  send(message: any) {
    if (this.socket) {
      this.socket.emit('message', message);
    }
  }
}

export const wsService = new WebSocketService();