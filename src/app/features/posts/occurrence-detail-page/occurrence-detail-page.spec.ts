import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { CommentSection } from '../comment-section/comment-section';
import { OccurrenceDetailPage } from './occurrence-detail-page';

@Component({ selector: 'app-comment-section', template: '' })
class StubCommentSection {
  @Input() postId = '';
  @Input() currentUser: LoggedUser | null = null;
}

describe('OccurrenceDetailPage actions', () => {
  const occurrenceId = '66f1c0de0000000000000001';
  const occurrence: SpectrumPost = {
    id: occurrenceId,
    createdAt: '2026-09-01T12:00:00.000Z',
    authorName: 'Comunidade Demo',
    authorNickname: 'demo.comunidade',
    authorInitial: 'C',
    authorCity: 'São Paulo - SP',
    title: 'Postes apagados na Rua Demo',
    content: 'Postes apagados',
    mediaType: 'text',
    publishedAt: '2026-09-01T12:00:00.000Z',
    publishedAtLabel: '01/09/2026',
    likes: 0,
    dislikes: 0,
    liked: false,
    disliked: false,
    comments: 0,
    reposts: 0,
    reposted: false,
    saved: false,
    tags: [],
    status: 'ABERTA',
    importance: 'ALTA',
    category: 'ILUMINACAO_PUBLICA',
    responsibleAgency: { id: 'iluminacao-demo', name: 'Serviço Fictício de Iluminação Pública' },
    evidences: [],
    forwardingHistory: [],
    confirmedByIds: [],
    history: [],
  };

  let user: LoggedUser | null;
  let fixture: ComponentFixture<OccurrenceDetailPage>;

  beforeEach(async () => {
    user = null;
    await TestBed.configureTestingModule({
      imports: [OccurrenceDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: occurrenceId }) } },
        },
        {
          provide: PostService,
          useValue: {
            getOccurrence: () => of(occurrence),
            getOccurrenceHistory: () => of([]),
            getRegisteredAgencies: () => of([{ _id: 'works', name: 'Obras', emails: ['works@example.com'] }]),
            getStatusLabel: (status: string) => status,
            getCategoryLabel: (category: string) => category,
            getImportanceLabel: (importance: string) => importance,
          },
        },
        { provide: UserService, useValue: { getCurrentUser: () => user } },
      ],
    })
      .overrideComponent(OccurrenceDetailPage, {
        remove: { imports: [CommentSection] },
        add: { imports: [StubCommentSection] },
      })
      .compileComponents();
  });

  function actionsFor(role: LoggedUser['occurrenceRole'], agencyId?: string): string[] {
    user = {
      _id: role ?? 'anonymous',
      name: 'Demo',
      nickname: 'demo',
      email: 'demo@spectrum.test',
      birthDate: '1990-01-01',
      occurrenceRole: role,
      occurrenceAgencyId: agencyId,
    };
    fixture = TestBed.createComponent(OccurrenceDetailPage);
    fixture.detectChanges();
    expect(fixture.componentInstance.occurrence?.id).toBe(occurrenceId);
    return Array.from(fixture.nativeElement.querySelectorAll('.occurrence-detail__action-group button'))
      .map((button) => (button as HTMLButtonElement).textContent?.trim().replace(/\s+/g, ' ') ?? '');
  }

  it('shows community actions without administrative controls at the demo URL', () => {
    const actions = actionsFor('USER');
    expect(actions).toEqual([
      'verified Também identifiquei este problema',
      'add_photo_alternate Adicionar evidência',
      'account_balance Sugerir órgão responsável',
      'task_alt Informar resolução',
    ]);
  });

  it('shows only related agency actions at the same URL', () => {
    expect(actionsFor('RESPONSIBLE_AGENCY', 'iluminacao-demo')).toEqual([
      'task_alt Informar resolução',
    ]);
  });

  it('does not show agency controls to an unrelated agency', () => {
    expect(actionsFor('RESPONSIBLE_AGENCY', 'outro-orgao')).toEqual([]);
  });

  it('shows moderator operations at the same URL', () => {
    expect(actionsFor('MODERATOR')).toEqual([
      'account_balance Associar órgão',
      'send Registrar encaminhamento',
    ]);
  });

  it('does not show actions without an authenticated user', () => {
    fixture = TestBed.createComponent(OccurrenceDetailPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.occurrence-detail__action-group button').length).toBe(0);
  });
  it('does not allow the agency to validate its own response', () => {
    actionsFor('RESPONSIBLE_AGENCY', 'iluminacao-demo');
    fixture.componentInstance.occurrence = { ...occurrence, status: 'RESOLUCAO_INFORMADA' };
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.componentInstance.canResolve).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Classificar resposta');
    expect(fixture.componentInstance.formatStatus()).toBe('Em andamento');
  });

  it('requires a verification note before closing and does not offer closure to the community', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = { ...occurrence, status: 'RESOLUCAO_INFORMADA' };
    expect(fixture.componentInstance.canResolve).toBe(false);
    fixture.componentInstance.submitResolve();
    expect(fixture.componentInstance.errorMessage).toContain('20 caracteres');
  });

  it('offers registered agencies and contacts for email forwarding', () => {
    actionsFor('MODERATOR');
    fixture.componentInstance.openPanel('forward');
    fixture.componentInstance.agencyId = 'works';
    fixture.componentInstance.selectRegisteredAgency();
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.componentInstance.agencyEmail).toBe('works@example.com');
    expect(fixture.nativeElement.querySelector('input[name="agencyEmail"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Encaminhar por e-mail');
    fixture.componentInstance.agencyId = '';
    fixture.componentInstance.submitForwarding();
    expect(fixture.componentInstance.errorMessage).toContain('órgão cadastrado');
  });

  it('keeps forwarding unavailable during the editing window', () => {
    actionsFor('MODERATOR');
    fixture.componentInstance.occurrence = { ...occurrence, status: 'AGUARDANDO_ENCAMINHAMENTO', createdAt: new Date().toISOString() };
    expect(fixture.componentInstance.canForward).toBe(false);
  });

  it('shows closed occurrences and offers contestation followed by reopening', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = { ...occurrence, status: 'RESOLVIDA' };
    expect(fixture.componentInstance.formatStatus()).toBe('Fechada');
    expect(fixture.componentInstance.canContest).toBe(true);
    expect(fixture.componentInstance.canReopen).toBe(false);
    fixture.componentInstance.occurrence = { ...occurrence, status: 'CONTESTADA' };
    expect(fixture.componentInstance.canReopen).toBe(true);
    fixture.componentInstance.occurrence = { ...occurrence, status: 'REABERTA' };
    expect(fixture.componentInstance.formatStatus()).toBe('Aberta');
  });

});
