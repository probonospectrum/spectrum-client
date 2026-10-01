// Isolated visual fixture. Not imported by the application or production configuration.
// Run: npm start -- --build-target spectrum-client:build:visual-preview --port 4202
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { HttpInterceptorFn, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { of } from 'rxjs';
import { OccurrenceDetailPage } from '../src/app/features/posts/occurrence-detail-page/occurrence-detail-page';
import { LoggedUser, UserService } from '../src/app/core/services/user/user.service';

const params = new URLSearchParams(location.search);
const occurrenceId = '66f1c0de0000000000000001';
const agencyId = '66f1c0de0000000000000002';
const authorId = '66f1c0de0000000000000003';
const state = params.get('state') || 'pending';
const role = params.get('role') || 'USER';
const user: LoggedUser = { _id: role === 'USER' ? authorId : '66f1c0de0000000000000004', name: 'Marina Costa', nickname: 'marina.costa', email: 'preview@example.com', birthDate: '1990-01-01', cityUser: 'São Paulo', occurrenceRole: role as LoggedUser['occurrenceRole'], occurrenceAgencyId: agencyId };
const statuses: Record<string, string> = { pending: 'AGUARDANDO_ENCAMINHAMENTO', sent: 'ENCAMINHADA', failed: 'FALHA_NO_ENCAMINHAMENTO', review: 'RESPOSTA_EM_APURACAO', resolved: 'RESOLVIDA' };
const createdAt = new Date(Date.now() - (state === 'pending' ? 3 : 30) * 60_000).toISOString();
const agency = { id: agencyId, name: 'Secretaria Municipal de Iluminação', email: 'iluminacao@example.com' };
let post: any = {
  _id: occurrenceId, createdBy: authorId, title: 'Iluminação apagada na Praça das Flores',
  text: 'Três postes da praça estão apagados há uma semana. À noite, a passagem fica escura para quem volta do trabalho e para as famílias que frequentam o local.',
  description: 'Três postes da praça estão apagados há uma semana. À noite, a passagem fica escura para quem volta do trabalho e para as famílias que frequentam o local.',
  category: 'ILUMINACAO_PUBLICA', importance: 'ALTA', status: statuses[state], createdAt, updatedAt: createdAt,
  location: { label: 'Praça das Flores, Vila Mariana', address: 'Praça das Flores, próximo ao ponto de ônibus', cityName: 'São Paulo', cityId: '3550308', stateCode: 'SP', stateName: 'São Paulo', neighborhoodName: 'Vila Mariana' },
  confirmedByIds: ['community-1', 'community-2', 'community-3', 'community-4'], evidences: [],
  responsibleAgency: state === 'pending' ? null : agency,
  moderationReason: state === 'failed' ? 'FALHA_NO_ENCAMINHAMENTO' : state === 'review' ? 'RESPOSTA_EM_APURACAO' : null,
  forwardingDueAt: ['pending', 'sent'].includes(state) ? new Date(Date.now() + (state === 'pending' ? 12 * 60_000 : 15 * 86400_000)).toISOString() : null,
  forwardingHistory: state === 'pending' || state === 'failed' ? [] : [{ id: 'forward-1', agency, success: true, channel: 'EMAIL', sentAt: createdAt }],
  history: [{ id: 'event-1', occurrenceId, eventType: 'OCORRENCIA_CRIADA', actorType: 'USER', actorName: 'Marina Costa', occurredAt: createdAt, description: 'Ocorrência criada e disponibilizada para acompanhamento.' }],
};
if (state !== 'pending') post.history.push({ id: 'event-2', occurrenceId, eventType: 'ANALISE_DE_COMPETENCIA_INICIADA', actorType: 'SYSTEM', occurredAt: createdAt, description: 'Iniciada análise de competência.' });
if (post.forwardingHistory.length) post.history.push({ id: 'event-3', occurrenceId, eventType: 'OCORRENCIA_ENCAMINHADA', actorType: 'SYSTEM', occurredAt: createdAt, metadata: { agencyName: agency.name }, description: `Ocorrência encaminhada para ${agency.name}.` });
if (state === 'review') post.history.push({ id: 'event-4', occurrenceId, eventType: 'FORWARDING_RESPONSE_REGISTERED', actorType: 'MODERATOR', occurredAt: createdAt, description: 'Resposta recebida e encaminhada para apuração.', metadata: { responseReceived: 'A equipe realizou a troca das luminárias e restabeleceu a iluminação da praça.', responseCode: '02' } });

const fixtures: HttpInterceptorFn = request => {
  let body: unknown = [];
  if (request.url.endsWith('/agencies')) body = [{ _id: agencyId, name: agency.name, emails: [agency.email, 'ouvidoria@example.com'] }];
  else if (request.url.endsWith('/history')) body = post.history;
  else if (request.url.includes('/post/' + occurrenceId)) {
    if (request.method === 'POST') {
      const data = request.body as Record<string, string>;
      const status = request.url.endsWith('/review') ? ({ '01': 'REJEITADA', '02': 'RESOLVIDA', '03': 'EM_RESOLUCAO' }[data['responseCode']]) : request.url.endsWith('/response') ? 'RESPOSTA_EM_APURACAO' : 'ENCAMINHADA';
      post = { ...post, status, responsibleAgency: agency, moderationReason: status === 'RESPOSTA_EM_APURACAO' ? 'RESPOSTA_EM_APURACAO' : null };
    }
    body = post;
  }
  // All HTTP requests terminate here. This fixture never contacts a real backend.
  return of(new HttpResponse({ status: 200, body }));
};

@Component({ selector: 'app-root', imports: [RouterOutlet], template: `
  <aside class="preview-tools"><strong>Prévia visual · dados fictícios</strong>
    <a href="/ocorrencias/66f1c0de0000000000000001?state=pending">Comunidade</a>
    <a href="/ocorrencias/66f1c0de0000000000000001?state=failed&role=MODERATOR">Encaminhamento</a>
    <a href="/ocorrencias/66f1c0de0000000000000001?state=sent&role=RESPONSIBLE_AGENCY">Resposta</a>
    <a href="/ocorrencias/66f1c0de0000000000000001?state=review&role=MODERATOR">Moderação</a>
    <button (click)="toggleTheme()">Alternar tema</button>
  </aside><router-outlet />`, styles: [`.preview-tools {display:flex; flex-wrap:wrap; gap:16px; align-items:center; padding:12px 20px; background:var(--spectrum-surface); border-bottom:1px solid var(--spectrum-border); color:var(--spectrum-text); font-size:12px;} a {color:var(--spectrum-action)} button{cursor:pointer; border:1px solid var(--spectrum-border); color:var(--spectrum-text); background:var(--spectrum-surface); border-radius:8px; padding:5px 10px}`] })
class VisualPreview {
  toggleTheme() { document.documentElement.dataset['theme'] = document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark'; }
}
void bootstrapApplication(VisualPreview, { providers: [
  provideRouter([{ path: 'ocorrencias/:id', component: OccurrenceDetailPage }, { path: '**', redirectTo: 'ocorrencias/' + occurrenceId }]),
  provideHttpClient(withInterceptors([fixtures])),
  { provide: UserService, useValue: { getCurrentUser: () => user, getToken: () => null, logout: () => {} } },
] });
