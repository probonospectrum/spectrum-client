import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OccurrenceHistoryEvent, PostService, SpectrumPost } from '../../../core/services/posts/post.service';
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
            informOccurrenceResolution: vi.fn(() => of(occurrence)),
            canModifyPost: () => false,
            getOccurrenceHistory: () => of([]),
            getResponsibleAgencies: () => of([]),
            getAgenciesForLocation: () => of([]),
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

  it.each([
    [{}, '/publicacoes', 'Voltar para publicações'],
    [{ origem: 'orgao' }, '/perfil', 'Voltar para órgão público'],
    [{ origem: 'orgao', perfilOrgao: 'secretaria_obras' }, '/perfil/secretaria_obras', 'Voltar para órgão público'],
  ])('shows the return link for the entry point %j', (query, url, label) => {
    Object.assign(TestBed.inject(ActivatedRoute).snapshot, { queryParamMap: convertToParamMap(query) });
    fixture = TestBed.createComponent(OccurrenceDetailPage);
    fixture.detectChanges();

    const view: HTMLElement = fixture.nativeElement;
    const link = view.querySelector('.occurrence-detail__back');
    expect(link?.getAttribute('href')).toBe(url);
    expect(link?.textContent).toContain(label);
  });

  it('shows the three latest visible updates and reveals older updates five at a time', async () => {
    const history = Array.from({ length: 12 }, (_, index): OccurrenceHistoryEvent => ({
      id: 'event-' + index,
      occurrenceId,
      eventType: 'ANALISE_INICIADA',
      actorType: 'SYSTEM',
      occurredAt: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
    })).reverse();
    history.unshift({ id: 'hidden-community-event', occurrenceId, eventType: 'EVIDENCIA_ADICIONADA',
      actorId: 'other', actorType: 'USER', occurredAt: '2026-09-30T12:00:00Z' });
    vi.spyOn(TestBed.inject(PostService), 'getOccurrenceHistory').mockReturnValue(of(history));
    fixture = TestBed.createComponent(OccurrenceDetailPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const view: HTMLElement = fixture.nativeElement;
    const rows = () => view.querySelectorAll('#occurrence-history > li');
    const more = () => view.querySelector<HTMLButtonElement>('button[aria-controls="occurrence-history"]');
    expect(rows()).toHaveLength(3);
    expect(page.visibleTimeline.map(event => event.id)).toEqual(['event-11', 'event-10', 'event-9']);
    expect(page.timeline).toHaveLength(12);
    expect(more()?.textContent).toContain('Ver atualizações mais antigas');
    more()!.click();
    await fixture.whenStable();
    expect(rows()).toHaveLength(8);
    expect(page.visibleTimeline.at(-1)?.id).toBe('event-4');
    more()!.click();
    await fixture.whenStable();
    expect(rows()).toHaveLength(12);
    expect(page.visibleTimeline.at(-1)?.id).toBe('event-0');
    expect(more()).toBeNull();
    expect(page.timeline[0].id).toBe('event-0');
    page.loadOccurrence();
    await fixture.whenStable();
    expect(rows()).toHaveLength(3);
    expect(more()).not.toBeNull();
  });

  it.each([0, 1, 3])('does not show a history expansion button for %i updates', (count) => {
    const history = Array.from({ length: count }, (_, index): OccurrenceHistoryEvent => ({
      id: 'event-' + index, occurrenceId, eventType: 'ANALISE_INICIADA', actorType: 'SYSTEM',
      occurredAt: '2026-09-02T12:00:00Z',
    }));
    vi.spyOn(TestBed.inject(PostService), 'getOccurrenceHistory').mockReturnValue(of(history));
    fixture = TestBed.createComponent(OccurrenceDetailPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('#occurrence-history > li')).toHaveLength(count);
    expect(fixture.nativeElement.querySelector('button[aria-controls="occurrence-history"]')).toBeNull();
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
      'task_alt Informar resolução',
    ]);
  });

  it('hides agency suggestions when an agency is linked and enables them when unassigned', () => {
    actionsFor('USER');
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find(item => (item as HTMLButtonElement).textContent?.includes('Sugerir órgão responsável')) as HTMLButtonElement;
    expect(button).toBeUndefined();
    expect(fixture.componentInstance.canSuggestAgency).toBe(false);
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null };
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.componentInstance.canSuggestAgency).toBe(true);
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null, linkedAgencyIds: ['previous-agency'] };
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.componentInstance.canSuggestAgency).toBe(false);
  });

  it('shows only related agency actions at the same URL', () => {
    expect(actionsFor('RESPONSIBLE_AGENCY', 'iluminacao-demo')).toEqual(['add_photo_alternate Adicionar evidência', 'Adicionar resolução']);
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
    service.getAgenciesForLocation = vi.fn(() => of([
      { id: 'city', name: 'Secretaria de Obras', stateCode: 'SP', cities: ['Guarulhos'] },
      { id: 'state', name: 'Defesa Civil Estadual', stateCode: 'SP' },
      { id: 'other-city', name: 'Secretaria de Campinas', stateCode: 'SP', cities: ['Campinas'] },
      { id: 'other-state', name: 'Secretaria de Curitiba', stateCode: 'PR', cities: ['Curitiba'] },
    ]));

    fixture.componentInstance.openPanel('agency');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(service.getAgenciesForLocation).toHaveBeenCalledWith('SP', 'Guarulhos');
    expect(fixture.componentInstance.occurrenceRegionLabel).toBe('Guarulhos - SP');
    expect(fixture.componentInstance.filteredAgencyDirectory.map(agency => agency.id)).toEqual(['city']);
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

  it('requires selecting a registered regional agency rather than submitting a typed name', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null };
    fixture.componentInstance.onAgencyDirectorySearchChange('Órgão inventado');
    fixture.componentInstance.submitAgency();
    expect(fixture.componentInstance.errorMessage).toBe('Selecione um órgão cadastrado na cidade da ocorrência.');
  });

  it('lets the author choose a registered agency suggested by another person after loading history', () => {
    actionsFor('USER');
    const page = fixture.componentInstance;
    page.occurrence = { ...occurrence, responsibleAgency: null };
    const agency = { id: '66f1c0de0000000000000002', name: 'Secretaria de Obras' };
    page.historyEvents = [{
      id: 'suggestion', occurrenceId, eventType: 'ORGAO_RESPONSAVEL_SUGERIDO',
      actorType: 'USER', actorId: 'another-user', actorName: 'Outra pessoa',
      occurredAt: occurrence.createdAt, metadata: { agencyName: agency.name, agency },
    }];
    expect(page.agencySuggestions[0].agency.id).toBe(agency.id);
    expect(page.canAcceptAgencySuggestion(page.agencySuggestions[0])).toBe(true);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Escolher este órgão');
    expect(fixture.nativeElement.textContent).not.toContain('Órgão sem cadastro para encaminhamento');
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

  it.each([
    ['USER', undefined, true],
    ['USER', undefined, false],
    ['MODERATOR', undefined, true],
    ['RESPONSIBLE_AGENCY', 'iluminacao-demo', true],
    ['RESPONSIBLE_AGENCY', 'other-agency', false],
  ] as const)('applies protocol visibility for %s with agency %s and access %s', (role, agency, allowed) => {
    actionsFor(role, agency);
    const page = fixture.componentInstance;
    page.occurrence = {
      ...occurrence,
      createdBy: role === 'USER' && allowed ? 'USER' : 'another-user',
      forwardingHistory: [{ id: 'sent', success: true, channel: 'EMAIL', sentAt: occurrence.createdAt, protocol: 'ENC-104' }],
      agencyProgress: { protocol: 'AT-203', updatedAt: occurrence.createdAt, note: 'Atendimento em curso.', closedByAgency: false },
    };
    page.historyEvents = [{
      id: 'forwarding', occurrenceId, eventType: 'OCORRENCIA_ENCAMINHADA', actorType: 'SYSTEM',
      occurredAt: occurrence.createdAt, description: '', metadata: { protocol: 'HIST-105', agencyName: 'Iluminação' },
    }, {
      id: 'proposal', occurrenceId, eventType: 'RESOLUCAO_INFORMADA', actorType: 'RESPONSIBLE_AGENCY',
      occurredAt: occurrence.createdAt, description: '', metadata: { resolutionId: 'version-1', serviceReference: 'OS-106' },
    }];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const report = fixture.nativeElement.textContent as string;
    for (const protocol of ['ENC-104', 'AT-203', 'HIST-105', 'OS-106']) {
      expect(report.includes(protocol)).toBe(allowed);
    }
  });

  it('shows regional catalog suggestions as the community types', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = {
      ...occurrence,
      responsibleAgency: null,
      location: { label: 'Guarulhos - SP', cityName: 'Guarulhos', stateCode: 'SP' },
    };
    const service = TestBed.inject(PostService);
    service.getAgenciesForLocation = vi.fn(() => of([
      { id: 'city', name: 'Secretaria de Obras', stateCode: 'SP', cities: ['Guarulhos'] },
      { id: 'state', name: 'Defesa Civil Estadual', stateCode: 'SP' },
      { id: 'other-city', name: 'Secretaria de Campinas', stateCode: 'SP', cities: ['Campinas'] },
      { id: 'other-state', name: 'Secretaria de Curitiba', stateCode: 'PR', cities: ['Curitiba'] },
    ]));

    fixture.componentInstance.openPanel('agency');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(service.getAgenciesForLocation).toHaveBeenCalledWith('SP', 'Guarulhos');
    expect(fixture.componentInstance.occurrenceRegionLabel).toBe('Guarulhos - SP');
    expect(fixture.componentInstance.filteredAgencyDirectory.map(agency => agency.id)).toEqual(['city']);
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

  it('requires selecting a registered regional agency rather than submitting a typed name', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null };
    fixture.componentInstance.onAgencyDirectorySearchChange('Órgão inventado');
    fixture.componentInstance.submitAgency();
    expect(fixture.componentInstance.errorMessage).toBe('Selecione um órgão cadastrado na cidade da ocorrência.');
  });

  it('lets the author choose a registered agency suggested by another person after loading history', () => {
    actionsFor('USER');
    const page = fixture.componentInstance;
    page.occurrence = { ...occurrence, responsibleAgency: null };
    const agency = { id: '66f1c0de0000000000000002', name: 'Secretaria de Obras' };
    page.historyEvents = [{
      id: 'suggestion', occurrenceId, eventType: 'ORGAO_RESPONSAVEL_SUGERIDO',
      actorType: 'USER', actorId: 'another-user', actorName: 'Outra pessoa',
      occurredAt: occurrence.createdAt, metadata: { agencyName: agency.name, agency },
    }];
    expect(page.agencySuggestions[0].agency.id).toBe(agency.id);
    expect(page.canAcceptAgencySuggestion(page.agencySuggestions[0])).toBe(true);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Escolher este órgão');
    expect(fixture.nativeElement.textContent).not.toContain('Órgão sem cadastro para encaminhamento');
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
    const page = fixture.componentInstance;
    expect(page.canRecordAgencyProgress).toBe(true);
    expect(page.canSubmitAgencyResolution).toBe(true);
    page.openPanel('agencyProgress');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Fechada pelo órgão');
    page.occurrence = { ...occurrence, createdAt: new Date().toISOString() };
    expect(page.canRecordAgencyProgress).toBe(false);
    expect(page.canSubmitAgencyResolution).toBe(false);
  });

  it('requires the work, verified outcome, execution date and proof for a directly linked agency', () => {
    actionsFor('USER');
    user!.accountType = 'PUBLIC_AGENCY';
    const page = fixture.componentInstance;
    page.occurrence = {
      ...occurrence,
      status: 'EM_ANALISE_DE_COMPETENCIA',
      responsibleAgency: { id: user!._id, name: 'Órgão vinculado' },
    };
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(page.canSubmitAgencyResolution).toBe(true);
    const section = fixture.nativeElement.querySelector('#resolucao') as HTMLElement;
    expect(section.textContent).toContain('Adicionar resolução');
    page.openPanel('resolution');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(section.querySelector('textarea[name="resolutionStatement"]')).not.toBeNull();
    expect(section.querySelector('textarea[name="resolutionOutcome"]')).not.toBeNull();
    const send = TestBed.inject(PostService).informOccurrenceResolution;
    page.submitResolution();
    expect(page.errorMessage).toContain('resultado verificado');
    page.resolutionStatement = 'A equipe substituiu a lâmpada no poste indicado.';
    page.resolutionOutcome = 'O poste voltou a iluminar a rua após o teste.';
    page.submitResolution();
    expect(page.errorMessage).toContain('data de execução');
    page.resolutionExecutionDate = page.latestResolutionExecutionDate;
    page.submitResolution();
    expect(page.errorMessage).toContain('Anexe uma evidência');
    expect(send).not.toHaveBeenCalled();
    page.resolutionServiceReference = ' OS-104 ';
    page.submitResolution();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ id: occurrenceId }), user,
      'A equipe substituiu a lâmpada no poste indicado.', [], {
        executionDate: page.latestResolutionExecutionDate,
        outcome: 'O poste voltou a iluminar a rua após o teste.',
        serviceReference: 'OS-104',
      });
  });

  it('shows an open contestation window to the community and removes the action at the deadline', () => {
    actionsFor('USER');
    const page = fixture.componentInstance;
    page.occurrence = {
      ...occurrence,
      status: 'RESOLUCAO_EM_ANALISE',
      agencyResolution: { id: 'version-1', contestUntil: new Date(Date.now() + 60_000).toISOString() },
    };
    expect(page.canContest).toBe(true);
    page.contestDeadlineReached.set(true);
    expect(page.canContest).toBe(false);
  });

  it('allows the moderator to close early only when the active proposal was contested', () => {
    actionsFor('MODERATOR');
    const page = fixture.componentInstance;
    page.occurrence = {
      ...occurrence,
      evidences: [{ id: 'photo', type: 'IMAGE', description: 'Foto do reparo', url: 'https://example.test/photo.jpg', addedAt: occurrence.createdAt }],
      status: 'RESOLUCAO_EM_ANALISE',
      agencyResolution: { id: 'version-1', contestUntil: new Date(Date.now() + 60_000).toISOString() },
    };
    const event = { occurrenceId, occurredAt: occurrence.createdAt, createdAt: occurrence.createdAt, description: '' };
    page.historyEvents = [
      { ...event, id: 'proposal', eventType: 'RESOLUCAO_INFORMADA', actorType: 'RESPONSIBLE_AGENCY',
        evidenceIds: ['photo'], metadata: { resolutionId: 'version-1', statement: 'Troca da lâmpada',
          outcome: 'O poste voltou a funcionar após teste noturno.', executionDate: '2026-09-20', serviceReference: 'OS-104' } },
      { ...event, id: 'current-contest', eventType: 'RESOLUCAO_CONTESTADA', actorType: 'USER',
        metadata: { resolutionId: 'version-1', reason: 'O poste continua apagado.' } },
      { ...event, id: 'old-contest', eventType: 'RESOLUCAO_CONTESTADA', actorType: 'USER',
        metadata: { resolutionId: 'previous-version', reason: 'Contestação anterior.' } },
    ];
    page.openPanel('resolve');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const review = fixture.nativeElement.querySelector('.occurrence-detail__resolution-review') as HTMLElement;
    expect(review.textContent).toContain('Troca da lâmpada');
    expect(review.textContent).toContain('O poste voltou a funcionar após teste noturno.');
    expect(review.textContent).toContain('20/09/2026');
    expect(review.textContent).toContain('OS-104');
    expect(review.querySelector('a')?.textContent).toContain('Foto do reparo');
    const thread = review.querySelector<HTMLButtonElement>('.occurrence-detail__contest-toggle')!;
    expect(thread.getAttribute('aria-expanded')).toBe('false');
    expect(review.textContent).not.toContain('O poste continua apagado.');
    thread.click();
    fixture.detectChanges();
    expect(thread.getAttribute('aria-expanded')).toBe('true');
    expect(review.textContent).toContain('O poste continua apagado.');
    expect(review.textContent).not.toContain('Contestação anterior.');
    thread.click();
    fixture.detectChanges();
    expect(review.textContent).not.toContain('O poste continua apagado.');
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('form button'));
    const closeButton = buttons.find(button => button.textContent?.includes('Validar e encerrar ocorrência'));
    const rejectButton = buttons.find(button => button.textContent?.includes('Invalidar resolução'));
    expect(rejectButton?.disabled).toBe(false);
    expect(closeButton?.disabled).toBe(false);
    page.historyEvents = page.historyEvents.filter(event => event.id !== 'current-contest');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(closeButton?.disabled).toBe(true);
    expect(closeButton?.getAttribute('aria-describedby')).toBe('resolution-approval-deadline');
    const view: HTMLElement = fixture.nativeElement;
    expect(view.querySelector('#resolution-approval-deadline')?.textContent)
      .toMatch(/Validação aguarda o prazo de contestação.*\d{2}\/\d{2}\/\d{4}/s);
    page.contestDeadlineReached.set(true);
    fixture.detectChanges();
    expect(closeButton?.disabled).toBe(false);
    expect(view.querySelector('#resolution-approval-deadline')).toBeNull();
  });

  it('does not show agency controls to an unrelated agency', () => {
    expect(actionsFor('RESPONSIBLE_AGENCY', 'outro-orgao')).toEqual(['add_photo_alternate Adicionar evidência']);
  });

  it('shows moderator operations at the same URL', () => {
    const actions = actionsFor('MODERATOR');
    const pageText = fixture.nativeElement.textContent;
    expect(pageText).not.toContain('Acompanhe a evolução');
    expect(pageText).not.toContain('Evidências e solicitações');
    expect(pageText).toContain('Discussão');
    expect(actions).toEqual([
      'attach_file Anexar evidência enviada pelo órgão',
      'send Encaminhar por e-mail',
    ]);
  });

  it('does not show actions without an authenticated user', () => {
    fixture = TestBed.createComponent(OccurrenceDetailPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.occurrence-detail__action-group button').length).toBe(0);
  });
  it('shows only official and creator actions to every viewer', () => {
    actionsFor('USER');
    const base = { occurrenceId, eventType: 'EVIDENCIA_ADICIONADA', occurredAt: '2026-09-02T12:00:00Z' };
    fixture.componentInstance.historyEvents = [
      { ...base, id: 'creator', actorId: occurrence.createdBy, actorType: 'USER' },
      { ...base, id: 'community', actorId: 'other', actorType: 'USER' },
      { ...base, id: 'unknown', actorType: 'USER' },
      { ...base, id: 'agency', actorId: 'agency', actorType: 'RESPONSIBLE_AGENCY' },
      { ...base, id: 'moderation', actorId: 'moderator', actorType: 'MODERATOR' },
      { ...base, id: 'system', actorType: 'SYSTEM' },
    ] as OccurrenceHistoryEvent[];
    expect(fixture.componentInstance.timeline.map(event => event.id)).toEqual(['creator', 'agency', 'moderation', 'system']);
    fixture.componentInstance.occurrence = { ...occurrence, createdBy: 'other' };
    expect(fixture.componentInstance.timeline.map(event => event.id)).toEqual(['community', 'agency', 'moderation', 'system']);
  });

  it('preserves community suggestions in the creator panel when the API timeline is filtered', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = { ...occurrence, history: [{
      id: 'community-suggestion', occurrenceId, eventType: 'ORGAO_RESPONSAVEL_SUGERIDO',
      actorId: 'other', actorType: 'USER', actorOrigin: 'Ana', occurredAt: '2026-09-02T12:00:00Z',
      metadata: { agency: { id: 'works', name: 'Obras' } },
    }] };
    expect(fixture.componentInstance.timeline).toHaveLength(0);
    expect(fixture.componentInstance.agencySuggestions[0]).toMatchObject({ suggestedBy: 'Ana', supportCount: 1 });
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

  it('lets only the creator decide pending evidence and prevents duplicate decisions', () => {
    actionsFor('USER');
    const page = fixture.componentInstance;
    const pending = { id: 'pending', type: 'IMAGE' as const, addedAt: occurrence.createdAt, status: 'PENDING' as const, description: 'Foto enviada pela comunidade' };
    page.occurrence = { ...occurrence, createdBy: 'USER', evidences: [pending] };
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aguardando análise do criador');
    const accept = fixture.nativeElement.querySelector('button[aria-label="Aceitar evidência: Foto enviada pela comunidade"]');
    expect(accept).not.toBeNull();
    const review = vi.fn().mockReturnValue(of({ ...page.occurrence, evidences: [{ ...pending, status: 'APPROVED' }] }));
    Object.assign(TestBed.inject(PostService), { reviewOccurrenceEvidence: review });
    accept.click();
    expect(review).toHaveBeenCalledWith(expect.objectContaining({ id: occurrenceId }), user, 'pending', true);
    expect(page.successMessage).toContain('aceita');
    expect(page.canReviewEvidence(page.occurrence!.evidences[0])).toBe(false);
    page.occurrence = { ...occurrence, createdBy: 'someone-else', evidences: [pending] };
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[aria-label^="Rejeitar evidência"]')).toBeNull();
    page.reviewEvidence(pending, false);
    expect(review).toHaveBeenCalledTimes(1);
  });

  it('keeps pending evidence available for retry after a review error', () => {
    actionsFor('USER');
    const page = fixture.componentInstance;
    const pending = { id: 'pending', type: 'IMAGE' as const, addedAt: occurrence.createdAt, status: 'PENDING' as const };
    page.occurrence = { ...occurrence, createdBy: 'USER', evidences: [pending] };
    Object.assign(TestBed.inject(PostService), { getOccurrence: () => of(page.occurrence), reviewOccurrenceEvidence: vi.fn().mockReturnValue(throwError(() => new Error('Falha de conexão'))) });
    page.reviewEvidence(pending, false);
    expect(page.isSubmitting()).toBe(false);
    expect(page.errorMessage).toBeTruthy();
    expect(page.canReviewEvidence(pending)).toBe(true);
  });

  it('keeps an empty suggestions section visible to the author', () => {
    actionsFor('USER');
    fixture.componentInstance.occurrence = { ...occurrence, responsibleAgency: null };
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ainda não há sugestões');
  });

  it('ranks grouped agencies by distinct participants rather than repeated submissions', () => {
    actionsFor('USER');
    const events = [
      ['Obras', 'ana'], [' Obras ', 'ana'], ['Meio Ambiente', 'ana'], ['Meio Ambiente', 'bia'],
    ];
    fixture.componentInstance.historyEvents = events.map(([name, actorId], index) => ({
      id: String(index), occurrenceId, eventType: 'ORGAO_RESPONSAVEL_SUGERIDO',
      actorId, actorName: actorId, actorType: 'USER', occurredAt: '2026-09-02T12:00:00.000Z',
      metadata: { agency: { name } },
    }));
    const suggestions = fixture.componentInstance.agencySuggestions;
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].agency.name).toBe('Meio Ambiente');
    expect(suggestions.map(suggestion => suggestion.supportCount)).toEqual([2, 1]);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const sortButton = fixture.nativeElement.querySelector('.occurrence-detail__sort-button') as HTMLButtonElement;
    expect(sortButton.textContent).toContain('Mais sugeridos');
    sortButton.click();
    fixture.detectChanges();
    expect(sortButton.textContent).toContain('Menos sugeridos');
    expect(fixture.componentInstance.filteredAgencySuggestions.map(item => item.supportCount)).toEqual([1, 2]);
    sortButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredAgencySuggestions.map(item => item.supportCount)).toEqual([2, 1]);
    expect(fixture.componentInstance.canAcceptAgencySuggestion(suggestions[0])).toBe(false);
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
