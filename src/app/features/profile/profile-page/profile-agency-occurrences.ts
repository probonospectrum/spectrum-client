import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, exhaustMap, finalize, startWith, switchMap, tap, timeout } from 'rxjs';
import { LocalizedDatePipe, TranslatePipe } from '../../../core/i18n/translate.pipe';
import { OCCURRENCE_STATUS_DETAILS } from '../../../core/services/posts/occurrence-flow';
import { OccurrenceStatus } from '../../../core/services/posts/post.service';
import { AgencyInboxItem, AgencyOccurrenceSummary, PublicAgencyService } from '../../../core/services/user/public-agency.service';

@Component({
  selector: 'app-profile-agency-occurrences',
  imports: [RouterLink, LocalizedDatePipe, TranslatePipe],
  templateUrl: './profile-agency-occurrences.html',
  styleUrl: './profile-agency-occurrences.scss',
})
export class ProfileAgencyOccurrences {
  private readonly api = inject(PublicAgencyService);
  private readonly requests = new Subject<string | undefined>();
  readonly filter = signal<'open' | 'resolved'>('open');
  readonly profileId = input<string>();
  readonly profileNickname = input<string>();
  readonly search = signal('');
  private readonly searchTerm = signal('');
  readonly order = signal<'newest' | 'oldest'>('newest');
  private readonly query = computed(() => ({
    profileId: this.profileId(),
    status: this.filter(),
    search: this.searchTerm(),
    order: this.order(),
  }));
  readonly summary = signal<AgencyOccurrenceSummary | null>(null);
  readonly resolutionRate = computed(() => {
    const summary = this.summary();
    return summary?.total ? Math.min(100, Math.round(100 * summary.resolved / summary.total)) : 0;
  });
  readonly items = signal<AgencyInboxItem[]>([]);
  readonly cursor = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    toObservable(this.search).pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(destroyRef),
    ).subscribe(value => this.searchTerm.set(value.trim()));

    let previousProfileId: string | undefined;
    toObservable(this.query).pipe(
      switchMap(({ profileId, ...query }) => {
        if (profileId !== previousProfileId) {
          this.summary.set(null);
          previousProfileId = profileId;
        }
        this.items.set([]);
        this.cursor.set(null);
        return this.requests.pipe(
          startWith(undefined),
          exhaustMap(cursor => {
            this.loading.set(true);
            this.error.set(false);
            const options = { ...query, limit: 3, ...(cursor ? {} : { summary: 1 }) };
            const pageRequest = profileId
              ? this.api.profileOccurrences(profileId, cursor, options)
              : this.api.inbox(cursor, options);
            return pageRequest.pipe(
              timeout(15000),
              tap(page => {
                const items = new Map(this.items().map(item => [item._id, item]));
                page.data.forEach(item => items.set(item._id, item));
                this.items.set([...items.values()]);
                this.cursor.set(page.nextCursor);
                if (page.summary) this.summary.set(page.summary);
              }),
              catchError(() => {
                this.error.set(true);
                return EMPTY;
              }),
              finalize(() => this.loading.set(false)),
            );
          }),
        );
      }),
      takeUntilDestroyed(destroyRef),
    ).subscribe();
  }

  loadPage(): void {
    this.requests.next(this.cursor() ?? undefined);
  }

  statusLabel(status: string): string {
    return OCCURRENCE_STATUS_DETAILS[status as OccurrenceStatus] ?? status;
  }
}
