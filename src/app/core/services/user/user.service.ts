import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { USER_ROUTES } from '../../constants/api-routes';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  name: string;
  nickname: string;
  email: string;
  password: string;
  birthDate: string;
  avatarUrl: string;
  cityId: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(USER_ROUTES.login, payload);
  }

  create(payload: CreateUserRequest): Observable<unknown> {
    return this.http.post(USER_ROUTES.create, payload);
  }
}
