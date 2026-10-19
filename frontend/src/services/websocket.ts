type MessageHandler = (data: any) => void;

class FleetWebSocket {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private isExplicitlyClosed: boolean = false;

  get connected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem('fleet_access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws${token ? `?token=${token}` : ''}`;

    this.isConnecting = true;
    this.isExplicitlyClosed = false;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        console.log('[WS] Connected to Fleet WebSocket live stream');
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handlers.forEach(h => h(payload));
        } catch (e) {
          console.warn('[WS] Failed to parse message', event.data);
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
        if (!this.isExplicitlyClosed) {
          // Reconnect in 3 seconds
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WS] WebSocket error:', err);
      };
    } catch (e) {
      this.isConnecting = false;
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export const fleetWs = new FleetWebSocket();
