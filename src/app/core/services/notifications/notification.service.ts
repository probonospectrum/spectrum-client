import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Subject, Subscription, catchError, debounceTime, of, switchMap, timeout } from 'rxjs';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../constants/api-routes';
import { UserService } from '../user/user.service';
import { SpectrumNotification } from '../account/account-mock.service';

export interface UserNotification extends SpectrumNotification {
  postId?: string;
  createdAt: string;
}
interface ApiNotification extends Omit<UserNotification, 'type' | 'dateLabel'> {
  type: string;
}
interface NotificationPage {
  data: ApiNotification[];
  nextCursor: string | null;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly url = API_BASE_URL + '/notifications';
  private readonly refresh = new Subject<void>();
  private request?: Subscription;
  private pageRequest?: Subscription;
  readonly notifications = signal<UserNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly connected = signal(false);
  private readonly cursor = signal<string | null>(null);
  readonly hasMore = computed(() => !!this.cursor());

  constructor() {
    effect((onCleanup) => {
      const token = this.users.token();
      const userId = this.users.currentUser()?._id;
      this.notifications.set([]);
      this.unreadCount.set(0);
      this.cursor.set(null);
      this.error.set('');
      this.loading.set(false);
      this.connected.set(false);
      if (!token || !userId) return;
      this.loading.set(true);
      const subscription = this.refresh
        .pipe(
          debounceTime(100),
          switchMap(() => {
            this.pageRequest?.unsubscribe();
            this.loadingMore.set(false);
            return this.http.get<NotificationPage>(this.url).pipe(
              timeout(15000),
              catchError(() => {
                this.error.set('Não foi possível carregar as notificações. Tente novamente.');
                this.loading.set(false);
                return of(null);
              }),
            );
          }),
        )
        .subscribe((page) => {
          if (!page) return;
          this.notifications.set(page.data.map((item) => this.present(item)));
          this.cursor.set(page.nextCursor);
          this.unreadCount.set(page.unreadCount);
          this.error.set('');
          this.loading.set(false);
        });
      const socket = io(API_BASE_URL + '/realtime', { auth: { token }, reconnection: true });
      socket.on('connect', () => {
        this.connected.set(true);
        this.reload();
      });
      socket.on('disconnect', () => this.connected.set(false));
      socket.on('connect_error', () => this.connected.set(false));
      for (const event of [
        'notification:created',
        'notification:read',
        'notification:deleted',
        'notification:refresh',
      ]) {
        socket.on(event, () => this.reload());
      }
      this.reload();
      onCleanup(() => {
        socket.disconnect();
        subscription.unsubscribe();
        this.request?.unsubscribe();
        this.pageRequest?.unsubscribe();
        this.loadingMore.set(false);
      });
    });
  }
  reload(): void {
    this.refresh.next();
  }
  loadMore(): void {
    const cursor = this.cursor();
    if (!cursor || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.pageRequest = this.http
      .get<NotificationPage>(this.url + '/page/' + cursor)
      .pipe(timeout(15000))
      .subscribe({
        next: (page) => {
          const items = new Map(this.notifications().map((item) => [item.id, item]));
          for (const item of page.data) items.set(item.id, this.present(item));
          this.notifications.set([...items.values()]);
          this.cursor.set(page.nextCursor);
          this.unreadCount.set(page.unreadCount);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loadingMore.set(false);
          this.error.set('Não foi possível carregar mais notificações.');
        },
      });
  }
  markRead(id: string): void {
    this.mutate(this.http.patch(this.url + '/' + id + '/read', {}));
  }
  markAllRead(): void {
    this.mutate(this.http.patch(this.url + '/read-all', {}));
  }
  remove(id: string): void {
    this.mutate(this.http.delete(this.url + '/' + id));
  }
  private mutate(request: ReturnType<HttpClient['delete']>): void {
    if (this.request && !this.request.closed) return;
    this.request = request.pipe(timeout(15000)).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Não foi possível salvar a alteração. Tente novamente.'),
    });
  }
  private present(item: ApiNotification): UserNotification {
    return {
      ...item,
      type: 'confirmation',
      dateLabel: new Date(item.createdAt).toLocaleString('pt-BR'),
    };
  }
}
