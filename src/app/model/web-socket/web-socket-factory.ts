import { $WebSocket, WebSocketConfig } from 'angular2-websocket/angular2-websocket';

export class WebSocketFactory {
    static create(url: string, config: WebSocketConfig): $WebSocket {
        return new $WebSocket(url, null, config);
    }
}