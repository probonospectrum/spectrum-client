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
  inAppNotifications: boolean;
  emailNotifications: boolean;
  importantUpdates: boolean;
  securityAlerts: boolean;
  news: boolean;
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
      type: 'alert',
      title: 'Nova movimentacao na sua cidade',
      description: 'Uma publicacao em Xique-Xique recebeu muitas interacoes nos ultimos minutos.',
      dateLabel: 'Hoje, 09:42',
      read: false,
      actionLabel: 'Ver publicacao',
    },
    {
      id: 'nt-2',
      type: 'message',
      title: 'Luana Prado respondeu voce',
      description: 'Elu comentou na conversa sobre achados e perdidos da comunidade.',
      dateLabel: 'Hoje, 08:16',
      read: false,
      actionLabel: 'Abrir conversa',
    },
    {
      id: 'nt-3',
      type: 'confirmation',
      title: 'Perfil atualizado',
      description: 'Suas informacoes foram salvas com sucesso no Spectrum.',
      dateLabel: 'Ontem, 18:30',
      read: true,
    },
    {
      id: 'nt-4',
      type: 'system',
      title: 'Melhoria nas notificacoes',
      description: 'Agora voce pode filtrar alertas importantes e novidades separadamente.',
      dateLabel: '07/08/2026, 12:05',
      read: true,
    },
    {
      id: 'nt-5',
      type: 'movement',
      title: 'Seu post esta em destaque',
      description: 'A publicacao sobre seguranca no bairro teve 184 curtidas e 14 comentarios.',
      dateLabel: '06/08/2026, 21:11',
      read: true,
      actionLabel: 'Revisar metricas',
    },
  ];

  private settings: SettingsData = {
    language: 'pt-BR',
    compactMode: false,
    inAppNotifications: true,
    emailNotifications: true,
    importantUpdates: true,
    securityAlerts: true,
    news: false,
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
    const name = user?.name || 'Gabriela Araujo';
    return {
      name,
      nickname: user?.nickname || 'Gabi09_2',
      email: user?.email || 'gabriela@spectrum.com',
      phone: '(11) 98922-0410',
      role: 'Moderadore de comunidade',
      cityUser: user?.cityUser || 'Xique-Xique - BA',
      birthDate: user?.birthDate || '2001-04-18',
      bio: 'Acompanho alertas locais, comunidades de bairro e conversas importantes no Spectrum.',
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
