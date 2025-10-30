
export interface TrackingUpdate {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
}

export interface TrackingListener {
  onUpdate: (update: TrackingUpdate) => void;
  onError: (error: Error) => void;
  onDisconnect: () => void;
}

export class LetaTrackingService {
  private domain: string;
  private connections: Map<string, WebSocket> = new Map();
  private listeners: Map<string, TrackingListener[]> = new Map();

  constructor(domain: string = 'sandbox.integrations.leta.ai') {
    this.domain = domain;
  }

  public async startTracking(
    orderSlug: string,
    listener: TrackingListener
  ): Promise<void> {
    try {
      console.log(` Starting real-time tracking for order: ${orderSlug}`);

      const wsUrl = `wss://${this.domain}/ws/orders/${orderSlug}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`Connected to tracking for order: ${orderSlug}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          const update: TrackingUpdate = {
            orderId: orderSlug,
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            timestamp: new Date(),
            accuracy: data.accuracy ? parseFloat(data.accuracy) : undefined,
            speed: data.speed ? parseFloat(data.speed) : undefined,
          };

          console.log(` Location update for ${orderSlug}:`, {
            lat: update.latitude,
            lng: update.longitude,
          });

          const orderListeners = this.listeners.get(orderSlug) || [];
          orderListeners.forEach(l => l.onUpdate(update));
          listener.onUpdate(update);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          listener.onError(err);
        }
      };

      ws.onerror = (event) => {
        const error = new Error(`WebSocket error for order ${orderSlug}`);
        console.error(' Tracking error:', error);
        listener.onError(error);
      };

      ws.onclose = () => {
        console.log(`Tracking disconnected for order: ${orderSlug}`);
        this.connections.delete(orderSlug);
        listener.onDisconnect();
      };

      this.connections.set(orderSlug, ws);

      if (!this.listeners.has(orderSlug)) {
        this.listeners.set(orderSlug, []);
      }
      this.listeners.get(orderSlug)!.push(listener);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      listener.onError(err);
    }
  }

  public stopTracking(orderSlug: string): void {
    console.log(` Stopping tracking for order: ${orderSlug}`);

    const ws = this.connections.get(orderSlug);
    if (ws) {
      ws.close();
      this.connections.delete(orderSlug);
    }

    this.listeners.delete(orderSlug);
  }


  public stopAllTracking(): void {
    console.log(' Stopping all tracking');

    this.connections.forEach((ws) => {
      ws.close();
    });

    this.connections.clear();
    this.listeners.clear();
  }


  public addListener(orderSlug: string, listener: TrackingListener): void {
    if (!this.listeners.has(orderSlug)) {
      this.listeners.set(orderSlug, []);
    }
    this.listeners.get(orderSlug)!.push(listener);
  }

  public removeListener(orderSlug: string, listener: TrackingListener): void {
    const listeners = this.listeners.get(orderSlug);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }


  public isTracking(orderSlug: string): boolean {
    return this.connections.has(orderSlug);
  }


  public getTrackedOrders(): string[] {
    return Array.from(this.connections.keys());
  }
}


export function createTrackingHandler() {
  const listeners: Map<string, (update: TrackingUpdate) => void> = new Map();

  return {
    onUpdate: (update: TrackingUpdate) => {
      const handler = listeners.get(update.orderId);
      if (handler) {
        handler(update);
      }
    },
    subscribe: (orderId: string, handler: (update: TrackingUpdate) => void) => {
      listeners.set(orderId, handler);
      return () => listeners.delete(orderId);
    },
  };
}
