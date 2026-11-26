import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgencyInboxService } from '../../../core/services/user/agency-inbox.service';
import { OCCURRENCE_STATUS_DETAILS } from '../../../core/services/posts/occurrence-flow';
import { OccurrenceStatus } from '../../../core/services/posts/post.service';

@Component({
  selector: 'app-agency-inbox-sidebar',
  imports: [RouterLink],
  template: ` <section class="agency-sidebar" aria-label="Ocorrências do órgão">
    <header>
      <span class="material-symbols-outlined" aria-hidden="true">inbox</span>
      <h2>Ocorrências do órgão</h2>
      <span class="count">{{ inbox.total() }}</span>
    </header>
    <p class="intro">Vínculos recebidos pela sua instituição</p>
    @if (inbox.loading()) {
      <p class="feedback" role="status">Carregando ocorrências…</p>
    }
    @if (inbox.error()) {
      <p class="feedback" role="alert">
        {{ inbox.error() }} <button type="button" (click)="inbox.reload()">Tentar novamente</button>
      </p>
    }
    <div class="agency-sidebar__list">
      @for (post of inbox.items().slice(0, 5); track post._id) {
        <a [routerLink]="['/ocorrencias', post._id]" [attr.title]="post.title">
          <span
            class="status-dot"
            [class.resolved]="post.status === 'RESOLVIDA'"
            aria-hidden="true"
          ></span>
          <span class="item-content"
            ><strong>{{ post.title }}</strong
            ><small>{{ label(post.status) }}</small></span
          >
          <span class="material-symbols-outlined arrow" aria-hidden="true">chevron_right</span>
        </a>
      } @empty {
        @if (!inbox.loading() && !inbox.error()) {
          <p class="feedback">Os relatos vinculados ao seu órgão aparecerão aqui.</p>
        }
      }
    </div>
    <a class="view-all" routerLink="/orgao-publico/caixa-de-entrada"
      >Ver todas as ocorrências <span aria-hidden="true">↗</span></a
    >
  </section>`,
  styleUrl: './agency-inbox-sidebar.scss',
})
export class AgencyInboxSidebar {
  readonly inbox = inject(AgencyInboxService);
  label(status: string) {
    return OCCURRENCE_STATUS_DETAILS[status as OccurrenceStatus] || status;
  }
}
