import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-routes';
import { UserService } from './user.service';

export const COMMUNITY_TERMS_VERSION = '2026-11-27';
export type TermsAction = 'create' | 'contest' | 'attach';

const actionMessage: Record<TermsAction, string> = {
  create: 'Para criar uma ocorrência, leia e aceite os Termos do Spectrum.',
  contest: 'Para contestar uma resolução, leia e aceite os Termos do Spectrum.',
  attach: 'Para anexar um documento, uma foto ou um vídeo, leia e aceite os Termos do Spectrum.',
};

interface TermsPrompt {
  message: string;
  accept: () => Promise<void> | void;
  refuse: () => void;
  cancel: () => void;
}

@Injectable({ providedIn: 'root' })
export class CommunityTermsService {
  private readonly injector = inject(Injector);
  private readonly users = inject(UserService);
  private readonly endpoint = API_BASE_URL + '/user/me/community-terms';
  readonly prompt = signal<TermsPrompt | null>(null);

  openRegistration(onChoice: (accepted: boolean) => void): void {
    this.prompt.set({
      message: '',
      accept: () => onChoice(true),
      refuse: () => onChoice(false),
      cancel: () => {},
    });
  }

  async requireAcceptance(action: TermsAction): Promise<boolean> {
    const token = this.users.token();
    if (!token || this.prompt()) return false;
    try {
      const status = await firstValueFrom(this.injector.get(HttpClient).get<{ accepted: boolean }>(this.endpoint).pipe(timeout(10000)));
      if (this.users.token() !== token) return false;
      return status.accepted || this.openAction(action);
    } catch {
      // The acceptance request provides its own retry and error feedback.
      return this.users.token() === token && this.openAction(action);
    }
  }

  async openAction(action: TermsAction): Promise<boolean> {
    const token = this.users.token();
    if (!token || this.prompt()) return false;
    return new Promise<boolean>(resolve => {
      this.prompt.set({
        message: actionMessage[action],
        accept: async () => {
          if (this.users.token() !== token) throw new Error('Sessão alterada');
          await firstValueFrom(
            this.injector.get(HttpClient).post(this.endpoint, { version: COMMUNITY_TERMS_VERSION }).pipe(timeout(10000)),
          );
          resolve(this.users.token() === token);
        },
        refuse: () => resolve(false),
        cancel: () => resolve(false),
      });
    });
  }
}
