import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { catchError, exhaustMap, merge, of, Subject, Subscription, timeout, timer } from 'rxjs';
import { UserService } from './user.service';
import { AgencyInboxItem, PublicAgencyService } from './public-agency.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable({ providedIn: 'root' })
export class AgencyInboxService {
  private readonly api = inject(PublicAgencyService);
  private readonly users = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly refresh = new Subject<void>();
  private pageRequest?: Subscription;
  readonly items = signal<AgencyInboxItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly cursor = signal<string | null>(null);
  readonly enabled = computed(() => {
    const user = this.users.currentUser();
    return (
      user?.occurrenceRole === 'RESPONSIBLE_AGENCY' &&
      user.agencyRegistrationStatus === 'APPROVED' &&
      !!user.occurrenceAgencyId
    );
  });
  constructor() {
    effect((onCleanup) => {
      const userId = this.users.currentUser()?._id;
      const agencyId = this.users.currentUser()?.occurrenceAgencyId;
      const enabled = this.enabled();
      this.items.set([]);
      this.total.set(0);
      this.cursor.set(null);
      this.error.set('');
      this.loading.set(false);
      if (!enabled || !userId || !agencyId) return;
      this.loading.set(true);
      const subscription = merge(timer(0, 30000), this.refresh)
        .pipe(
          exhaustMap(() =>
            this.api.inbox().pipe(
              timeout(15000),
              catchError((error) => {
                if (error.status === 401 || error.status === 403) {
                  this.items.set([]);
                  this.total.set(0);
                  this.cursor.set(null);
                }
                this.error.set('Não foi possível atualizar as ocorrências. Tente novamente.');
                return of(null);
              }),
            ),
          ),
        )
        .subscribe((page) => {
          this.loading.set(false);
          if (!page) return;
          const firstPage = new Set(page.data.map((item) => item._id));
          const previous = this.items();
          // Keep older pages visible while refreshing recent arrivals.
          this.items.set([
            ...page.data,
            ...(page.nextCursor
              ? previous.filter(
                  (item) =>
                    !firstPage.has(item._id) &&
                    page.data.length &&
                    item._id < page.data[page.data.length - 1]._id,
                )
              : []),
          ]);
          if (previous.length <= 30) this.cursor.set(page.nextCursor);
          this.total.set(page.total);
          this.error.set('');
        });
      onCleanup(() => {
        subscription.unsubscribe();
        this.pageRequest?.unsubscribe();
        this.loadingMore.set(false);
      });
    });
    effect(() => {
      const latest = this.notifications.notifications()[0];
      if (latest?.eventType === 'agency_linked') this.refresh.next();
    });
  }
  reload() {
    this.refresh.next();
  }
  loadMore() {
    const cursor = this.cursor();
    if (!cursor || this.loadingMore() || !this.enabled()) return;
    this.loadingMore.set(true);
    this.pageRequest = this.api
      .inbox(cursor)
      .pipe(timeout(15000))
      .subscribe({
        next: (page) => {
          const items = new Map(this.items().map((item) => [item._id, item]));
          page.data.forEach((item) => items.set(item._id, item));
          this.items.set([...items.values()]);
          this.cursor.set(page.nextCursor);
          this.total.set(page.total);
          this.loadingMore.set(false);
          this.error.set('');
        },
        error: () => {
          this.error.set('Não foi possível carregar mais ocorrências. Tente novamente.');
          this.loadingMore.set(false);
        },
      });
  }
}
