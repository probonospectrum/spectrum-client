import { Injectable } from '@angular/core';
import { LoggedUser } from '../user/user.service';

export type NotificationType = 'system' | 'movement' | 'alert' | 'message' | 'confirmation';

export interface SpectrumNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  dateLabel: string;
  read: boolean;
  actionLabel?: string;
  actorName?: string;
  actorHandle?: string;
  actorAvatarUrl?: string;
}

export interface ProfileData {
  name: string;
  nickname: string;
  email: string;
  phone: string;
  role: string;
  cityUser: string;
  birthDate: string;
  bio: string;
  avatarInitial: string;
}

export interface SettingsData {
  language: string;
  compactMode: boolean;
  privateAccount: boolean;
  darkTheme: boolean;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  importantUpdates: boolean;
  securityAlerts: boolean;
  news: boolean;
  twoFactorAuth: boolean;
  activeSessions: number;
  trustedDevice: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccountMockService {
  private notifications: SpectrumNotification[] = [
  {
    id: 'nt-1',
    type: 'message',
    title: 'Marina Costa comentou em sua publicação',
    description: 'Ela compartilhou uma experiência parecida e sugeriu reunir outros relatos sobre o assunto.',
    dateLabel: 'Hoje, 10:14',
    read: false,
    actionLabel: 'Ver publicacao',
    actorName: 'Marina Costa',
    actorHandle: 'marina.costa',
  },
  {
    id: 'nt-2',
    type: 'confirmation',
    title: 'Lucas Oliveira curtiu seu relato',
    description: 'Sua publicação sobre convivência recebeu um novo apoio.',
    dateLabel: 'Hoje, 08:47',
    read: false,
    actionLabel: 'Ver publicacao',
    actorName: 'Lucas Oliveira',
    actorHandle: 'lucas.oliveira',
  },
  {
    id: 'nt-3',
    type: 'confirmation',
    title: 'Beatriz Lima começou a seguir você',
    description: 'Vocês agora podem acompanhar as publicações um do outro.',
    dateLabel: 'Ontem, 19:32',
    read: true,
    actorName: 'Beatriz Lima',
    actorHandle: 'beatriz.lima',
  },
  {
    id: 'nt-4',
    type: 'system',
    title: 'Novas respostas em uma conversa acompanhada',
    description: 'A discussão sobre acessibilidade em espaços públicos recebeu novas contribuições.',
    dateLabel: '15/09/2026, 16:05',
    read: true,
    actorName: 'Spectrum',
  },
  {
    id: 'nt-5',
    type: 'movement',
    title: 'Gabriel Santos respondeu ao seu comentário',
    description: 'Ele acrescentou uma sugestão à conversa sobre respeito e acolhimento.',
    dateLabel: '14/09/2026, 21:11',
    read: true,
    actionLabel: 'Ver publicacao',
    actorName: 'Gabriel Santos',
    actorHandle: 'gabriel.santos',
  },
];

  private settings: SettingsData = {
    language: 'pt-BR',
    compactMode: false,
    privateAccount: false,
    darkTheme: false,
    inAppNotifications: true,
    emailNotifications: true,
    importantUpdates: true,
    securityAlerts: true,
    news: false,
    twoFactorAuth: false,
    activeSessions: 2,
    trustedDevice: 'Windows - Sao Paulo',
  };

  getNotifications(): SpectrumNotification[] {
    return this.notifications.map((notification) => ({ ...notification }));
  }

  markNotificationAsRead(id: string): void {
    this.notifications = this.notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    );
  }

  markAllNotificationsAsRead(): void {
    this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }));
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);
  }

  getProfile(user: LoggedUser | null): ProfileData {
    const name = user?.name || 'Ana Martins';
    return {
      name,
      nickname: user?.nickname || 'ana.martins',
      email: user?.email || 'ana.martins@example.com',
      phone: '',
      role: 'Participante da comunidade',
      cityUser: user?.cityUser || 'São Paulo - SP',
      birthDate: user?.birthDate || '2002-06-12',
      bio: 'Gosto de conversar sobre convivência, educação e formas de tornar os espaços mais acolhedores.',
      avatarInitial: name.charAt(0).toUpperCase(),
    };
  }

  saveProfile(profile: ProfileData): ProfileData {
    return { ...profile, avatarInitial: profile.name.charAt(0).toUpperCase() || 'S' };
  }

  getSettings(): SettingsData {
    return { ...this.settings };
  }

  saveSettings(settings: SettingsData): SettingsData {
    this.settings = { ...settings };
    return this.getSettings();
  }
}
