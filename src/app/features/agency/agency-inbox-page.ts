import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { AgencyInboxService } from '../../core/services/user/agency-inbox.service';
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
  private readonly router = inject(Router);
  readonly search = signal('');
  readonly filter = signal('all');
  readonly filtered = computed(() => {
    const query = this.search()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return this.inbox.items().filter((item) => {
      const text = `${item.title} ${item.location?.cityName || ''} ${item._id}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return (
        (!query || text.includes(query)) &&
        (this.filter() === 'all' ||
          (this.filter() === 'resolved'
            ? item.status === 'RESOLVIDA'
            : item.status !== 'RESOLVIDA'))
      );
    });
  });
  label(status: string) {
    return OCCURRENCE_STATUS_DETAILS[status as OccurrenceStatus] || status;
  }
  logout() {
    this.users.logout();
    void this.router.navigate(['/login']);
  }
}
