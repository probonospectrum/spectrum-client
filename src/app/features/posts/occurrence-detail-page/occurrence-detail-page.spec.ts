import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { CommentSection } from '../comment-section/comment-section';
import { OccurrenceDetailPage } from './occurrence-detail-page';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({ selector: 'app-social-shell', template: '<ng-content />' })
class StubSocialShell {
  @Input() user: LoggedUser | null = null;
  @Input() showContentHeader = false;
  @Input() wideContent = true;
  @Output() logout = new EventEmitter<void>();
  @Output() postUpdated = new EventEmitter<SpectrumPost>();
  openEditPost(_post: SpectrumPost) {}
}

@Component({ selector: 'app-comment-section', template: '' })
class StubCommentSection {
  @Input() responsibleAgencyId?: string;
  @Input() postId = '';
  @Input() currentUser: LoggedUser | null = null;
}

describe('OccurrenceDetailPage actions', () => {
  const occurrenceId = '66f1c0de0000000000000001';
  const occurrence: SpectrumPost = {
    id: occurrenceId,
    createdBy: 'USER',
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
            canModifyPost: () => false,
            getOccurrenceHistory: () => of([]),
            getResponsibleAgencies: () => of([]),
            getRegisteredAgencies: () => of([{ _id: 'works', name: 'Obras', emails: ['works@example.com'] }]),
            getStatusLabel: (status: string) => status,
            getCategoryLabel: (category: string) => category,
            getImportanceLabel: (importance: string) => importance,
          },
        },
        { provide: UserService, useValue: { getCurrentUser: () => user, currentUser: () => user } },
      ],
    })
      .overrideComponent(OccurrenceDetailPage, {
        remove: { imports: [CommentSection, SocialShell] },
        add: { imports: [StubCommentSection, StubSocialShell] },
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

  it('disables agency suggestions when an agency is linked and enables them when unassigned', () => {
    actionsFor('USER');
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find(item => (item as HTMLButtonElement).textContent?.includes('Sugerir órgão responsável')) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.componentInstance.canSuggestAgency).toBe(false);
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null };
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.componentInstance.canSuggestAgency).toBe(true);
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null, linkedAgencyIds: ['previous-agency'] };
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.componentInstance.canSuggestAgency).toBe(false);
  });

  it('shows only related agency actions at the same URL', () => {
    expect(actionsFor('RESPONSIBLE_AGENCY', 'iluminacao-demo')).toEqual([]);
    fixture.componentInstance.occurrence = { ...occurrence, status: 'ENCAMINHADA', forwardingHistory: [{ id: 'sent', success: true, channel: 'EMAIL', sentAt: occurrence.createdAt }] };
    expect(fixture.componentInstance.canRegisterResponse).toBe(true);
    expect(fixture.componentInstance.canResolve).toBe(false);
  });

  it('shows regional catalog suggestions as the community types', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = {
      ...occurrence,
      responsibleAgency: null,
      location: { label: 'Guarulhos - SP', cityName: 'Guarulhos', stateCode: 'SP' },
    };
    const service = TestBed.inject(PostService);
    service.getResponsibleAgencies = vi.fn(() => of([
      { id: 'city', name: 'Secretaria de Obras', stateCode: 'SP', cities: ['Guarulhos'] },
      { id: 'state', name: 'Defesa Civil Estadual', stateCode: 'SP' },
      { id: 'other-city', name: 'Secretaria de Campinas', stateCode: 'SP', cities: ['Campinas'] },
      { id: 'other-state', name: 'Secretaria de Curitiba', stateCode: 'PR', cities: ['Curitiba'] },
    ]));

    fixture.componentInstance.openPanel('agency');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(fixture.componentInstance.occurrenceRegionLabel).toBe('Guarulhos - SP');
    expect(fixture.componentInstance.filteredAgencyDirectory.map(agency => agency.id)).toEqual(['city', 'state']);
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum órgão encontrado pelo nome nesta região.');

    fixture.componentInstance.onAgencyDirectorySearchChange('obras');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(1);
    (fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement).click();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.componentInstance.agencyName).toBe('Secretaria de Obras');
    expect(fixture.componentInstance.agencyId).toBe('city');

    fixture.componentInstance.onAgencyDirectorySearchChange('inexistente');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges(false);
    expect(fixture.nativeElement.textContent).toContain('Nenhum órgão encontrado pelo nome nesta região.');
  });

  it('shows grouped suggestions privately, previews supporters and opens the complete list', () => {
    actionsFor('USER');
    const suggestions = [
      ['Secretaria de Obras', 'ana', 'Ana'],
      ['Secretaria de Obras', 'bia', 'Bia'],
      ['Secretaria de Obras', 'caio', 'Caio'],
      ['Secretaria de Obras', 'ana', 'Ana'],
      ['Defesa Civil', 'bia', 'Bia'],
      ['Defesa Civil', 'dora', 'Dora'],
    ];
    fixture.componentInstance.historyEvents = suggestions.map(([name, actorId, actorName], index) => ({
      id: String(index), occurrenceId, eventType: 'ORGAO_RESPONSAVEL_SUGERIDO', actorId, actorName,
      actorType: 'USER', occurredAt: '2026-09-02T12:00:00.000Z',
      metadata: { agency: { id: name === 'Secretaria de Obras' ? '66f1c0de0000000000000002' : '66f1c0de0000000000000003', name } },
    }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(fixture.componentInstance.agencySuggestions.map(item => item.supportCount)).toEqual([3, 2]);
    const supportersPreview = fixture.nativeElement.querySelector('.occurrence-detail__participants') as HTMLButtonElement;
    expect(supportersPreview.textContent?.replace(/\s+/g, ' ').trim()).toBe('Ana, Bia e mais 1 pessoa');
    const sortButton = fixture.nativeElement.querySelector('.occurrence-detail__sort-button') as HTMLButtonElement;
    expect(sortButton.querySelector('.material-symbols-outlined')?.textContent).toBe('north');
    sortButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredAgencySuggestions.map(item => item.supportCount)).toEqual([2, 3]);
    expect(sortButton.querySelector('.material-symbols-outlined')?.textContent).toBe('south');

    fixture.componentInstance.agencySuggestionSearch = 'dora';
    expect(fixture.componentInstance.filteredAgencySuggestions.map(item => item.agency.name)).toEqual(['Defesa Civil']);
    fixture.componentInstance.agencySuggestionSearch = '';
    const suggestionCards = (fixture.nativeElement as HTMLElement).querySelectorAll('.occurrence-detail__suggestion');
    const worksSuggestion = Array.from(suggestionCards)
      .find(item => item.textContent?.includes('Secretaria de Obras')) as HTMLElement;
    (worksSuggestion.querySelector('.occurrence-detail__participants') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.textContent).toContain('Ana');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.textContent).toContain('Caio');
    (fixture.nativeElement.querySelector('.occurrence-detail__supporters-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    fixture.componentInstance.occurrence = { ...occurrence, createdBy: 'another-user' };
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-labelledby="agency-suggestions-title"]')).toBeNull();
    expect(fixture.componentInstance.timeline.some(event => event.eventType === 'ORGAO_RESPONSAVEL_SUGERIDO')).toBe(false);
  });

  it('offers status updates only for an approved related institution and requires evidence for closure', () => {
    actionsFor('RESPONSIBLE_AGENCY', 'iluminacao-demo');
    user!.agencyRegistrationStatus = 'APPROVED';
    expect(fixture.componentInstance.canRecordAgencyProgress).toBe(true);
    fixture.componentInstance.progressStatus = 'RESOLVIDA'; fixture.componentInstance.progressNote = 'Reparo executado pela equipe de manutenção.';
    fixture.componentInstance.submitAgencyProgress();
    expect(fixture.componentInstance.errorMessage).toContain('evidência');
    fixture.componentInstance.occurrence = { ...occurrence, status: 'ABERTA', createdAt: new Date().toISOString() };
    expect(fixture.componentInstance.canRecordAgencyProgress).toBe(false);
  });

  it('does not show agency controls to an unrelated agency', () => {
    expect(actionsFor('RESPONSIBLE_AGENCY', 'outro-orgao')).toEqual([]);
  });

  it('shows moderator operations at the same URL', () => {
    expect(actionsFor('MODERATOR')).toEqual([
      'send Encaminhar por e-mail',
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

  it('populates occurrenceMediaList and opens media in lightbox without external redirection', () => {
    fixture.componentInstance.occurrence = {
      ...occurrence,
      evidences: [
        {
          id: 'ev-1',
          type: 'IMAGE',
          url: 'https://example.com/img1.jpg',
          description: 'arquivo_teste.jpg',
          addedAt: '2026-09-01T12:00:00.000Z',
        },
        {
          id: 'ev-2',
          type: 'VIDEO',
          url: 'https://example.com/video1.mp4',
          description: 'video_gravado.mp4',
          addedAt: '2026-09-01T12:00:00.000Z',
        },
      ],
    };
    fixture.detectChanges();

    expect(fixture.componentInstance.occurrenceMediaList.length).toBe(2);
    expect(fixture.componentInstance.occurrenceMediaList[0].url).toBe('https://example.com/img1.jpg');

    fixture.componentInstance.openEvidenceInLightbox(fixture.componentInstance.occurrence.evidences[0]);
    expect(fixture.componentInstance.lightboxOpen).toBe(true);
    expect(fixture.componentInstance.lightboxIndex).toBe(0);

    fixture.componentInstance.closeLightbox();
    expect(fixture.componentInstance.lightboxOpen).toBe(false);

    // Verify raw file name is not rendered as attachment caption link
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.occurrence-detail__attachment-caption')).toBeNull();
  });
});

