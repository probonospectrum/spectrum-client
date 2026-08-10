import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../constants/api-routes';

export interface UserSocketMessage {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserWebsocketService {
  verifyEmail(token: string): Observable<UserSocketMessage> {
    return new Observable<UserSocketMessage>((observer) => {
      const socket = io(API_BASE_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 2,
      });

      const requestTimeout = window.setTimeout(() => {
        observer.error(new Error('O servidor demorou para responder. Tente novamente.'));
        socket.disconnect();
      }, 15000);

      socket.on('connect', () => {
        socket.emit('user:verify-email', { token });
      });

      socket.on('user:verify-email:success', (response: UserSocketMessage) => {
        window.clearTimeout(requestTimeout);
        observer.next(response);
        observer.complete();
        socket.disconnect();
      });

      socket.on('user:verify-email:error', (response: UserSocketMessage) => {
        window.clearTimeout(requestTimeout);
        observer.error(new Error(response.message));
        socket.disconnect();
      });

      socket.on('connect_error', () => {
        window.clearTimeout(requestTimeout);
        observer.error(new Error('Nao foi possivel conectar ao servidor.'));
        socket.disconnect();
      });

      return () => {
        window.clearTimeout(requestTimeout);
        socket.disconnect();
      };
    });
  }
}
