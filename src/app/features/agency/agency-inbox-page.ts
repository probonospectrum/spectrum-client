import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, timer, timeout } from 'rxjs';
import { UserService } from '../../core/services/user/user.service';
import { AgencyInboxService } from '../../core/services/user/agency-inbox.service';
import { AgencyInboxItem, PublicAgencyService } from '../../core/services/user/public-agency.service';
import { SocialShell } from '../../shared/components/social-shell/social-shell';
import { LocalizedDatePipe } from '../../core/i18n/translate.pipe';
import { OCCURRENCE_STATUS_DETAILS } from '../../core/services/posts/occurrence-flow';
import { OccurrenceStatus } from '../../core/services/posts/post.service';

@Component({
  selector: 'app-agency-inbox-page',
  imports: [SocialShell, RouterLink, LocalizedDatePipe],
  templateUrl: './agency-inbox-page.html',
  styleUrl: './agency-inbox-page.scss',
})
export class AgencyInboxPage {
  readonly users = inject(UserService);
  readonly inbox = inject(AgencyInboxService);
  private readonly api = inject(PublicAgencyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  readonly search = signal('');
  readonly filter = signal('open');
  readonly order = signal('newest');
  readonly items = signal<AgencyInboxItem[]>([]);
  readonly total = signal(0);
  readonly cursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  private readonly refresh = signal(0);
  private generation = 0;

  constructor() {
    effect(onCleanup => {
      const enabled = this.inbox.enabled();
      const userId = this.users.currentUser()?._id;
      const filters = { search: this.search().trim(), status: this.filter(), order: this.order() };
      this.refresh();
      const generation = ++this.generation;
      this.items.set([]);
      this.total.set(0);
      this.cursor.set(null);
      this.error.set('');
      this.loadingMore.set(false);
      this.loading.set(enabled);
      if (!enabled || !userId) return;
      const subscription = timer(200).pipe(
        switchMap(() => this.api.inbox(undefined, filters)),
        timeout(15000),
      ).subscribe({
        next: page => {
          if (generation !== this.generation) return;
          this.items.set(page.data);
          this.total.set(page.total);
          this.cursor.set(page.nextCursor);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Não foi possível carregar as ocorrências. Tente novamente.');
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
  reload() {
    this.refresh.update(value => value + 1);
    this.inbox.reload();
  }
  loadMore() {
    const cursor = this.cursor();
    if (!cursor || this.loadingMore() || this.loading()) return;
    const generation = this.generation;
    this.loadingMore.set(true);
    this.api.inbox(cursor, { search: this.search().trim(), status: this.filter(), order: this.order() })
      .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef)).subscribe({
        next: page => {
          if (generation !== this.generation) return;
          const items = new Map(this.items().map(item => [item._id, item]));
          page.data.forEach(item => items.set(item._id, item));
          this.items.set([...items.values()]);
          this.total.set(page.total);
          this.cursor.set(page.nextCursor);
          this.loadingMore.set(false);
        },
        error: () => {
          if (generation !== this.generation) return;
          this.loadingMore.set(false);
          this.error.set('Não foi possível carregar mais ocorrências. Tente novamente.');
        },
      });
  }
  label(status: string) {
    return OCCURRENCE_STATUS_DETAILS[status as OccurrenceStatus] || status;
  }
  logout() {
    this.users.logout();
    void this.router.navigate(['/login']);
  }
}
