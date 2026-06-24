declare module 'ws' {
  import { EventEmitter } from 'events';
  import { Server } from 'http';
  
  export class WebSocket extends EventEmitter {
    static OPEN: number;
    static CLOSED: number;
    static CONNECTING: number;
    
    constructor(address: string | URL, options?: any);
    
    readyState: number;
    send(data: string | Buffer): void;
    close(code?: number, reason?: string): void;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  
  export class WebSocketServer extends EventEmitter {
    constructor(options?: any);
    on(event: string, listener: (...args: any[]) => void): this;
  }
}
