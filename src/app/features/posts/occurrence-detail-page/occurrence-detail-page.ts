import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, defer, finalize, forkJoin, switchMap, of } from 'rxjs';
import { CommentSection } from '../comment-section/comment-section';
import {
  OccurrenceAgency,
  OccurrenceEvidence,
  OccurrenceEventType,
  OccurrenceForwardingChannel,
  OccurrenceHistoryEvent,
  OccurrenceAgencyOption,
  PostService,
  SpectrumPost,
} from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { LoadingIndicator } from '../../../shared/components/loading-indicator/loading-indicator';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
import { MediaLightbox } from '../../../shared/components/media-lightbox/media-lightbox';

import { occurrenceStage, OCCURRENCE_STATUS_DETAILS } from '../../../core/services/posts/occurrence-flow';

type ActionPanel =
  | 'agencyProgress'
  | 'response'
  | 'evidence'
  | 'agency'
  | 'forward'
  | 'forwardFailure'
  | 'analysis'
  | 'resolution'
  | 'resolve'
  | 'contest'
  | 'reopen'
  | null;

interface AgencySuggestion {
  event: OccurrenceHistoryEvent;
  agency: OccurrenceAgency;
  suggestedBy: string;
  supporterNames: string[];
  supportCount: number;
}

@Component({
  selector: 'app-occurrence-detail-page',
  imports: [TranslatePipe, UserAvatar, CommonModule, FormsModule, RouterLink, CommentSection, LoadingIndicator, SocialShell, MediaLightbox],
  templateUrl: './occurrence-detail-page.html',
  styleUrl: './occurrence-detail-page.scss',
})
export class OccurrenceDetailPage implements OnInit {
  progressStatus: 'EM_RESOLUCAO' | 'RESOLVIDA' = 'EM_RESOLUCAO';
  progressNote = ''; progressProtocol = ''; progressEvidenceIds: string[] = [];
  get canRecordAgencyProgress(): boolean {
    return this.isResponsibleAgencyForOccurrence && this.user?.agencyRegistrationStatus === 'APPROVED' &&
      !!this.occurrence && Date.now() >= new Date(this.occurrence.createdAt).getTime() + 15 * 60_000 &&
      !['RESOLVIDA','CONTESTADA','EM_ANALISE_DE_COMPETENCIA'].includes(this.occurrence.status);
  }
  get agencyEvidenceOptions() { return this.occurrence?.evidences.filter(e => e.addedBy === this.user?._id) ?? []; }
  submitAgencyProgress(): void {
    if (!this.occurrence || !this.canRecordAgencyProgress) return;
    if (this.progressNote.trim().length < 20) { this.errorMessage = 'Descreva o atendimento com pelo menos 20 caracteres.'; return; }
    if (this.progressStatus === 'RESOLVIDA' && !this.progressEvidenceIds.length) { this.errorMessage = 'Anexe e selecione uma evidência do atendimento para fechar.'; return; }
    this.runAction(() => this.postService.recordAgencyProgress(this.occurrence!, this.user, { status: this.progressStatus,
      note: this.progressNote.trim(), protocol: this.progressProtocol.trim() || undefined, evidenceIds: this.progressEvidenceIds }),
      this.progressStatus === 'RESOLVIDA' ? 'Ocorrência fechada pelo órgão com evidências. A comunidade pode contestar.' : 'Atendimento atualizado.');
  }
  readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.userService.getCurrentUser();
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  occurrence: SpectrumPost | null = null;
  historyEvents: OccurrenceHistoryEvent[] = [];
  actionPanel: ActionPanel = null;
  errorMessage = '';
  successMessage = '';
  notFound = false;
  private currentOccurrenceId = '';

  evidenceFile: File | null = null;
  evidenceDescription = '';
  agencyName = '';
  agencyId = '';
  agencyDirectorySearch = '';
  agencyDirectoryOpen = false;
  agencyDirectory: OccurrenceAgencyOption[] = [];
  agencyDirectoryError = '';
  readonly agencyDirectoryLoading = signal(false);
  private agencyDirectoryLoaded = false;
  agencySuggestionSearch = '';
  agencySuggestionOrder: 'most' | 'least' = 'most';
  selectedAgencySupporters: AgencySuggestion | null = null;
  agencyEmail = '';
  forwardingChannel: OccurrenceForwardingChannel = 'EMAIL';
  registeredAgencies: { _id: string; name: string; emails: string[] }[] = [];
  responseCode = '02';
  receivedResponseCode = '';
  responseMessage = '';
  responseProtocol = '';
  agenciesLoading = false;
  agenciesError = '';
  forwardingContent = '';
  forwardingProtocol = '';
  forwardingDeliveryConfirmed = false;
  forwardingFailureReason = '';
  analysisReference = '';
  analysisNote = '';
  resolutionStatement = '';
  resolutionReviewNote = '';
  contestReason = '';
  reopenReason = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.currentOccurrenceId = id ?? '';

    this.loadOccurrence();
    if (this.isModerator) this.loadAgencies();
  }

  loadAgencies(): void {
    this.agenciesLoading = true;
    this.agenciesError = '';
    this.postService.getRegisteredAgencies().pipe(finalize(() => this.agenciesLoading = false), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: agencies => this.registeredAgencies = agencies,
      error: error => this.agenciesError = this.getErrorMessage(error),
    });
  }

  logout(): void { this.userService.logout(); void this.router.navigate(['/login']); }

  onOccurrenceUpdated(post: SpectrumPost): void { this.afterAction(post, 'Alterações salvas. O encaminhamento usará as informações atualizadas.'); }

  get canEdit(): boolean { return !!this.occurrence && this.postService.canModifyPost(this.occurrence, this.user); }

  get canRegisterResponse(): boolean {
    return (this.isModerator || this.isResponsibleAgencyForOccurrence) && !!this.latestForwarding &&
      ['ENCAMINHADA', 'EM_RESOLUCAO', 'RESPOSTA_EM_APURACAO', 'FALHA_NO_ENCAMINHAMENTO'].includes(this.occurrence?.status ?? '');
  }

  submitResponse(): void {
    if (!this.occurrence || !this.canRegisterResponse || !this.responseMessage.trim()) {
      this.errorMessage = 'Informe a mensagem recebida do órgão.';
      return;
    }
    this.runAction(() => this.postService.registerForwardingResponse(this.occurrence!, this.user, this.latestForwarding!.id,
      this.responseMessage.trim(), this.receivedResponseCode, this.responseProtocol), 'Resposta registrada e disponível para análise da moderação.');
  }

  get nextStep(): string {
    if (this.occurrence?.status === 'RESOLVIDA' && this.occurrence.agencyProgress?.closedByAgency) return 'O órgão fechou o atendimento com evidências. A comunidade pode contestar se o problema persistir.';
    const messages: Record<string, string> = {
      AGUARDANDO_ENCAMINHAMENTO: 'Após os 15 minutos de edição, o sistema buscará o órgão responsável e enviará a ocorrência.',
      EM_ANALISE_DE_COMPETENCIA: 'O sistema está conferindo a localização e a categoria para identificar o órgão responsável.',
      ENCAMINHADA: 'Aguardamos a resposta do órgão. Se não houver retorno em 15 dias, o sistema fará um único reenvio.',
      FALHA_NO_ENCAMINHAMENTO: 'O envio não foi concluído. A moderação verificará o contato e a tentativa registrada.',
      RESPOSTA_EM_APURACAO: 'A resposta foi recebida. A moderação verificará as informações antes de atualizar a situação.',
      EM_RESOLUCAO: 'O órgão informou que está trabalhando na solução. Novas respostas serão avaliadas pela moderação.',
      REJEITADA: 'A ocorrência foi rejeitada pelo órgão e está disponível para reavaliação da moderação.',
      RESOLVIDA: 'A resolução foi validada pela moderação. Se o problema persistir, você pode registrar uma contestação.',
    };
    return this.moderationLabel ? `${this.moderationLabel}. A moderação verificará a ocorrência para dar continuidade ao acompanhamento.` :
      messages[this.occurrence?.status ?? ''] || 'A comunidade pode contribuir com evidências. Todas as atualizações ficam registradas no histórico.';
  }

  evidenceUrl(evidence: OccurrenceEvidence): string | null {
    return evidence.url && /^https?:\/\//i.test(evidence.url) ? evidence.url : null;
  }

  lightboxOpen = false;
  lightboxIndex = 0;

  get occurrenceMediaList(): Array<{ url: string; type: string; alt?: string }> {
    if (!this.occurrence?.evidences) return [];
    return this.occurrence.evidences
      .filter((e) => Boolean(this.evidenceUrl(e)))
      .map((e) => ({
        url: this.evidenceUrl(e)!,
        type: e.type,
        alt: this.occurrence?.title,
      }));
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  openEvidenceInLightbox(evidence: OccurrenceEvidence): void {
    const url = this.evidenceUrl(evidence);
    if (!url) return;
    const list = this.occurrenceMediaList;
    const foundIndex = list.findIndex((m) => m.url === url);
    if (foundIndex >= 0) {
      this.openLightbox(foundIndex);
    } else {
      this.lightboxIndex = 0;
      this.lightboxOpen = true;
    }
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  loadOccurrence(): void {
    const id = this.currentOccurrenceId;

    if (!id) {
      this.errorMessage = 'Ocorrência não informada.';
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.notFound = false;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin({
      occurrence: defer(() => this.postService.getOccurrence(id, this.user)),
      history: this.postService.getOccurrenceHistory(id),
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ occurrence, history }) => {
          this.occurrence = this.withHistoryAuthor(occurrence, history);
          this.historyEvents = history;
          this.prefillAgency(occurrence.responsibleAgency ?? undefined);
        },
        error: (error: unknown) => {
          this.notFound = this.isNotFound(error);
          this.errorMessage = this.notFound
            ? 'Ocorrência não encontrada.'
            : this.getErrorMessage(error);
        },
      });
  }

  get timeline(): OccurrenceHistoryEvent[] {
    return this.historyEvents.filter(event =>
      (Boolean(event.actorId && event.actorId === this.occurrence?.createdBy) ||
        ['RESPONSIBLE_AGENCY', 'AGENCY', 'MODERATOR', 'SYSTEM'].includes(event.actorType)) &&
      (this.isOccurrenceAuthor || event.eventType !== 'ORGAO_RESPONSAVEL_SUGERIDO'),
    ).sort(
      (first, second) =>
        new Date(first.createdAt ?? first.occurredAt).getTime() - new Date(second.createdAt ?? second.occurredAt).getTime(),
    );
  }

  get isMockOccurrence(): boolean {
    return Boolean(this.occurrence?.id.startsWith('mock-'));
  }

  displayAgencyName(name: string): string {
    return this.isMockOccurrence ? name.replace(/\s*\(exemplo\)/gi, '').trim() : name;
  }

  openAgencySupporters(suggestion: AgencySuggestion): void {
    this.selectedAgencySupporters = suggestion;
  }

  closeAgencySupporters(): void {
    this.selectedAgencySupporters = null;
  }

  get isOccurrenceAuthor(): boolean {
    return Boolean(this.user?._id && this.user._id === this.occurrence?.createdBy);
  }

  get agencySuggestions(): AgencySuggestion[] {
    if (!this.isOccurrenceAuthor) return [];
    const groups = new Map<string, AgencySuggestion & { participants: Map<string, string> }>();
    // As sugestões comunitárias ficam no painel do criador, fora da linha do tempo.
    const events = new Map([
      ...(this.occurrence?.history ?? []), ...this.historyEvents,
    ].map(event => [event.id, event]));
    for (const event of events.values()) {
      if (event.eventType !== 'ORGAO_RESPONSAVEL_SUGERIDO') continue;
      const agency = event.metadata?.['agency'] as OccurrenceAgency | undefined;
      const name = (agency?.name || String(event.metadata?.['agencyName'] ?? '')).trim();
      if (!name) continue;
      const key = agency?.id || this.normalizeAgencySearch(name).replace(/\s+/g, ' ');
      const participantName = event.actorName || event.actorOrigin || 'Usuário da comunidade';
      const participantKey = event.actorId || 'unknown';
      let group = groups.get(key);
      if (!group) {
        group = { event, agency: { id: agency?.id, name }, suggestedBy: '', supporterNames: [], supportCount: 0, participants: new Map() };
        groups.set(key, group);
      }
      group.participants.set(participantKey, participantName);
      group.supporterNames = [...group.participants.values()];
      group.suggestedBy = group.supporterNames.join(', ');
      group.supportCount = [...group.participants.keys()].filter(id => id !== 'unknown').length;
    }
    return [...groups.values()].sort((first, second) =>
      second.supportCount - first.supportCount || first.agency.name.localeCompare(second.agency.name, 'pt-BR'),
    );
  }

  get filteredAgencySuggestions(): AgencySuggestion[] {
    const query = this.normalizeAgencySearch(this.agencySuggestionSearch);
    return this.agencySuggestions
      .filter(({ agency, suggestedBy }) => !query || this.normalizeAgencySearch(`${agency.name} ${suggestedBy}`).includes(query))
      .sort((first, second) =>
        (this.agencySuggestionOrder === 'most'
          ? second.supportCount - first.supportCount
          : first.supportCount - second.supportCount) || first.agency.name.localeCompare(second.agency.name, 'pt-BR'),
      );
  }

  get confirmationCount(): number {
    return this.occurrence?.confirmedByIds.length ?? 0;
  }

  get userAlreadyConfirmed(): boolean {
    return Boolean(
      this.user?._id && this.occurrence?.confirmedByIds.includes(this.user._id),
    );
  }

  get isCommunityUser(): boolean {
    return Boolean(this.user && (this.user.occurrenceRole ?? 'USER') === 'USER');
  }

  get isModerator(): boolean {
    return this.user?.occurrenceRole === 'MODERATOR';
  }

  get isResponsibleAgencyForOccurrence(): boolean {
    return Boolean(
      this.user?.occurrenceRole === 'RESPONSIBLE_AGENCY' &&
        this.user.occurrenceAgencyId &&
        this.user.occurrenceAgencyId === this.occurrence?.responsibleAgency?.id,
    );
  }

  get canConfirmCommunity(): boolean {
    return this.isCommunityUser && !['RESOLVIDA'].includes(this.occurrence?.status ?? '');
  }

  get canAddEvidence(): boolean {
    return !!this.user && !['RESOLVIDA'].includes(this.occurrence?.status ?? '');
  }

  canReviewEvidence(evidence: OccurrenceEvidence): boolean {
    return !!this.user?._id && this.user._id === this.occurrence?.createdBy && evidence.status === 'PENDING';
  }

  evidenceStatusLabel(evidence: OccurrenceEvidence): string {
    if (evidence.status === 'PENDING') return 'Aguardando análise do criador';
    if (evidence.status === 'REJECTED') return 'Rejeitada pelo criador';
    return 'Aceita';
  }

  reviewEvidence(evidence: OccurrenceEvidence, approved: boolean): void {
    if (!this.occurrence || !this.canReviewEvidence(evidence) || this.isSubmitting()) return;
    this.runAction(
      () => this.postService.reviewOccurrenceEvidence(this.occurrence!, this.user, evidence.id, approved),
      approved ? 'Evidência aceita e incluída no relato.' : 'Evidência rejeitada.',
    );
  }

  get canSuggestAgency(): boolean {
    return this.isCommunityUser && !this.occurrence?.responsibleAgency?.id && !this.occurrence?.linkedAgencyIds?.length && !['RESOLVIDA'].includes(this.occurrence?.status ?? '');
  }

  get occurrenceRegionLabel(): string {
    return [this.occurrenceCity, this.occurrenceStateCode].filter(Boolean).join(' - ') || 'local da ocorrência';
  }

  get filteredAgencyDirectory(): OccurrenceAgencyOption[] {
    const query = this.normalizeAgencySearch(this.agencyDirectorySearch);
    return this.agencyDirectoryForOccurrence.filter((agency) =>
      !query || this.normalizeAgencySearch(agency.name).includes(query),
    );
  }

  get shouldShowAgencyDirectoryEmptyMessage(): boolean {
    return this.agencyDirectoryLoaded && !this.agencyDirectoryLoading() &&
      Boolean(this.agencyDirectorySearch.trim()) && !this.filteredAgencyDirectory.length;
  }

  private get occurrenceCity(): string {
    const location = this.occurrence?.location;
    if (location?.cityName || location?.city) return location.cityName || location.city || '';
    const label = this.occurrence?.authorCity || location?.label || '';
    return label.split(/\s+[-–,]\s+/)[0]?.trim() ?? '';
  }

  private get occurrenceStateCode(): string {
    const state = this.occurrence?.location?.stateCode || this.occurrence?.location?.state || '';
    if (/^[a-z]{2}$/i.test(state)) return state.toUpperCase();
    const label = this.occurrence?.authorCity || this.occurrence?.location?.label || '';
    return label.match(/[-–,]\s*([a-z]{2})\s*$/i)?.[1]?.toUpperCase() ?? '';
  }

  private get agencyDirectoryForOccurrence(): OccurrenceAgencyOption[] {
    const city = this.normalizeAgencySearch(this.occurrenceCity);
    const stateCode = this.normalizeAgencySearch(this.occurrenceStateCode);
    if (!city && !stateCode) return [];

    if (!city || !stateCode) return [];
    return this.agencyDirectory.filter(agency =>
      this.normalizeAgencySearch(agency.stateCode ?? '') === stateCode &&
      agency.cities?.some(agencyCity => this.normalizeAgencyCity(agencyCity) === city),
    );
  }

  private normalizeAgencyCity(city: string): string {
    return this.normalizeAgencySearch(city.replace(/\s+[-–,]\s*[a-z]{2}\s*$/i, ''));
  }

  private normalizeAgencySearch(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  }

  get canAssociateAgency(): boolean {
    return this.canForward;
  }

  get canAssumeResponsibility(): boolean {
    return false;
  }

  get canForward(): boolean {
    return this.isModerator && !!this.occurrence && Date.now() >= new Date(this.occurrence.createdAt).getTime() + 15 * 60_000 && ['AGUARDANDO_ENCAMINHAMENTO', 'EM_ANALISE_DE_COMPETENCIA', 'FALHA_NO_ENCAMINHAMENTO', 'ABERTA', 'SEM_ORGAO_IDENTIFICADO'].includes(this.occurrence.status);
  }

  get canRegisterForwardingFailure(): boolean {
    return false;
  }

  get canShowCommunityActions(): boolean {
    return (
      (this.canConfirmCommunity || this.canAddEvidence || this.canSuggestAgency || this.canInformResolution)
    );
  }

  get canShowAgencyActions(): boolean {
    return (
      this.isResponsibleAgencyForOccurrence &&
      (this.canRegisterResponse || this.canRecordAgencyProgress || this.canAddEvidence)
    );
  }

  get canShowModeratorActions(): boolean {
    return this.canForward || this.canRegisterResponse;
  }

  get hasAvailableActions(): boolean {
    return this.canShowCommunityActions || this.canShowAgencyActions || this.canShowModeratorActions || this.canResolve || this.canContest || this.canReopen;
  }

  get agencyActionLabel(): string {
    return this.canAssociateAgency ? 'Associar órgão' : 'Sugerir órgão responsável';
  }

  get agencySubmitLabel(): string {
    return this.canAssociateAgency ? 'Selecionar e encaminhar' : 'Enviar sugestão';
  }

  get canInformResolution(): boolean {
    if (!this.isCommunityUser) {
      return false;
    }

    return ['AGUARDANDO_ENCAMINHAMENTO', 'ABERTA', 'ENCAMINHADA', 'EM_ANALISE', 'EM_RESOLUCAO', 'REABERTA'].includes(
      this.occurrence?.status ?? '',
    );
  }

  get canResolve(): boolean {
    return this.isModerator && ['RESPOSTA_EM_APURACAO', 'RESOLUCAO_INFORMADA'].includes(this.occurrence?.status ?? '');
  }

  get canStartAnalysis(): boolean {
    return false;
  }

  get canContest(): boolean {
    return this.isCommunityUser && this.occurrence?.status === 'RESOLVIDA';
  }

  get canReopen(): boolean {
    return this.isCommunityUser && this.occurrence?.status === 'CONTESTADA';
  }

  get responsibleAgencyLabel(): string {
    return this.occurrence?.responsibleAgency?.name || 'Órgão responsável ainda não identificado';
  }

  get latestUpdateDate(): string {
    const eventDate = this.timeline.at(-1)?.createdAt ?? this.timeline.at(-1)?.occurredAt;
    return this.occurrence?.updatedAt ?? eventDate ?? this.occurrence?.createdAt ?? '';
  }

  get latestForwardingDate(): string {
    return this.latestForwarding?.sentAt ?? this.forwardingEventDate;
  }

  get currentProtocol(): string {
    const forwardingProtocol = this.latestForwarding?.protocol;

    if (forwardingProtocol) {
      return forwardingProtocol;
    }

    const protocolEvent = [...this.timeline]
      .reverse()
      .find((event) => event.metadata?.['protocol']);

    return protocolEvent?.metadata?.['protocol']
      ? String(protocolEvent.metadata['protocol'])
      : '';
  }

  private get latestForwarding() {
    return [...(this.occurrence?.forwardingHistory ?? [])]
      .filter((forwarding) => forwarding.success)
      .sort(
        (first, second) =>
          new Date(second.sentAt).getTime() - new Date(first.sentAt).getTime(),
      )[0];
  }

  private get forwardingEventDate(): string {
    const forwardingEvent = [...this.timeline]
      .reverse()
      .find((event) => event.eventType === 'OCORRENCIA_ENCAMINHADA');

    return forwardingEvent?.createdAt ?? forwardingEvent?.occurredAt ?? '';
  }

  openPanel(panel: ActionPanel): void {
    if (this.isSubmitting()) return;
    this.actionPanel = this.actionPanel === panel ? null : panel;
    this.evidenceFile = null;
    this.evidenceDescription = '';
    this.resolutionReviewNote = '';
    this.resolutionStatement = '';
    this.contestReason = '';
    this.reopenReason = '';
    this.analysisNote = '';
    this.errorMessage = '';
    this.successMessage = '';
    if (panel === 'agency' && !this.isModerator) this.loadAgencyDirectory();
  }

  acceptAgencySuggestion(suggestion: AgencySuggestion): void {
    if (!this.occurrence || !this.canAcceptAgencySuggestion(suggestion)) return;

    this.runAction(
      () => this.postService.acceptAgencySuggestion(this.occurrence!, this.user, suggestion.agency.id!),
      this.isMockOccurrence
        ? `Órgão de exemplo escolhido: ${this.displayAgencyName(suggestion.agency.name)}. Nenhum encaminhamento real foi realizado.`
        : `Órgão responsável escolhido: ${this.displayAgencyName(suggestion.agency.name)}.`,
    );
  }

  canAcceptAgencySuggestion(suggestion: AgencySuggestion): boolean {
    return Boolean(
      this.isOccurrenceAuthor && !this.occurrence?.responsibleAgency?.id && !this.occurrence?.linkedAgencyIds?.length &&
        this.isRegisteredAgencySuggestion(suggestion) &&
        ['ABERTA', 'SEM_ORGAO_IDENTIFICADO', 'AGUARDANDO_ENCAMINHAMENTO', 'EM_ANALISE_DE_COMPETENCIA', 'FALHA_NO_ENCAMINHAMENTO'].includes(this.occurrence?.status ?? '') &&
        !this.hasSuccessfulAgencyForwarding,
    );
  }

  isRegisteredAgencySuggestion(suggestion: AgencySuggestion): boolean {
    return this.isMockOccurrence
      ? this.postService.mockAgencies.some(agency => agency.id === suggestion.agency.id)
      : /^[a-f\d]{24}$/i.test(suggestion.agency.id ?? '');
  }

  get hasSuccessfulAgencyForwarding(): boolean {
    return Boolean(this.occurrence?.forwardingHistory.some(forwarding => forwarding.success));
  }

  get isAgencySelectionOnHold(): boolean {
    const createdAt = Date.parse(this.occurrence?.createdAt ?? '');
    return Number.isFinite(createdAt) && Date.now() - createdAt < 15 * 60_000;
  }

  onAgencyDirectorySearchChange(query: string): void {
    this.agencyDirectorySearch = query;
    this.agencyName = query;
    this.agencyId = '';
    this.agencyDirectoryOpen = true;
  }

  selectAgencyFromDirectory(agency: OccurrenceAgencyOption): void {
    this.agencyDirectorySearch = agency.name;
    this.agencyName = agency.name;
    this.agencyId = agency.id ?? '';
    this.agencyDirectoryOpen = false;
  }

  closeAgencyDirectory(): void {
    this.agencyDirectoryOpen = false;
  }

  private loadAgencyDirectory(): void {
    if (this.agencyDirectoryLoaded || this.agencyDirectoryLoading()) return;
    this.agencyDirectoryError = '';
    this.agencyDirectoryLoading.set(true);
    (this.isMockOccurrence
      ? this.postService.getResponsibleAgencies(this.occurrence?.id)
      : this.occurrenceCity && this.occurrenceStateCode
        ? this.postService.getAgenciesForLocation(this.occurrenceStateCode, this.occurrenceCity)
        : of([])).pipe(
      finalize(() => this.agencyDirectoryLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: agencies => {
        this.agencyDirectory = agencies;
        this.agencyDirectoryLoaded = true;
      },
      error: (error: unknown) => {
        this.agencyDirectoryError = this.getErrorMessage(error);
      },
    });
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.evidenceFile = input.files?.[0] ?? null;
  }

  confirmOccurrence(): void {
    if (!this.occurrence || !this.canConfirmCommunity || this.userAlreadyConfirmed || this.isSubmitting()) {
      return;
    }

    this.runAction(
      () => this.postService.confirmOccurrence(this.occurrence!, this.user),
      'Confirmação registrada sem alterar o status.',
    );
  }

  submitEvidence(): void {
    if (!this.occurrence || !this.canAddEvidence || !this.evidenceFile) {
      this.errorMessage = 'Selecione uma evidência para anexar.';
      return;
    }

    this.isSubmitting.set(true);
    this.postService
      .uploadEvidence(this.evidenceFile)
      .pipe(
        switchMap((upload) =>
          this.postService.addOccurrenceEvidence(this.occurrence!, this.user, {
            type: upload.type,
            url: upload.url,
            description: this.evidenceDescription || this.evidenceFile?.name,
          }),
        ),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (occurrence) => this.afterAction(occurrence, this.user?._id === occurrence.createdBy
          ? 'Evidência adicionada ao relato.'
          : 'Evidência enviada. Aguarde a análise do criador da ocorrência.'),
        error: (error: unknown) => (this.errorMessage = this.getErrorMessage(error)),
      });
  }

  submitAgency(): void {
    if (!this.occurrence || (!this.canAssociateAgency && !this.canSuggestAgency) || !this.agencyName.trim()) {
      this.errorMessage = 'Informe o nome do órgão responsável.';
      return;
    }

    if (!this.canAssociateAgency && !this.agencyDirectoryForOccurrence.some(agency => agency.id === this.agencyId)) {
      this.errorMessage = 'Selecione um órgão cadastrado na cidade da ocorrência.';
      return;
    }

    const action = this.canAssociateAgency
      ? this.postService.identifyResponsibleAgency(
          this.occurrence!,
          this.user,
          this.buildAgency(),
        )
      : this.postService.suggestResponsibleAgency(
          this.occurrence!,
          this.user,
          this.buildAgency(),
        );
    const message = this.canAssociateAgency
      ? 'Órgão responsável associado à ocorrência.'
      : 'Sugestão de órgão responsável registrada no histórico.';

    this.runAction(() => action, message);
  }

  assumeResponsibility(): void {
    if (!this.occurrence || !this.canAssumeResponsibility) {
      return;
    }

    this.runAction(
      () => this.postService.assumeAgencyResponsibility(this.occurrence!, this.user),
      'Responsabilidade assumida pelo órgão e registrada no histórico.',
    );
  }

  submitForwarding(): void {
    if (!this.occurrence || !this.canForward || !this.agencyId || !this.agencyEmail || !this.registeredContacts.includes(this.agencyEmail)) {
      this.errorMessage = 'Selecione um órgão cadastrado e aguarde o período de edição.';
      return;
    }
    this.runAction(() => this.postService.forwardOccurrence(this.occurrence!, this.user, {
      agency: this.buildAgency(), channel: 'EMAIL', sentContent: '',
    }), 'Encaminhamento enviado por e-mail e registrado no histórico.');
  }

  submitForwardingFailure(): void {
    if (!this.occurrence || !this.canRegisterForwardingFailure || !this.forwardingFailureReason.trim()) {
      this.errorMessage = 'Informe o motivo da falha.';
      return;
    }

    this.runAction(
      () => this.postService.registerForwardingFailure(this.occurrence!, this.user, {
        agency: this.agencyName.trim() ? this.buildAgency() : undefined,
        channel: this.forwardingChannel,
        sentContent: this.forwardingContent.trim() || undefined,
        failureReason: this.forwardingFailureReason.trim(),
      }),
      'Falha registrada sem alterar o status da ocorrência.',
    );
  }

  submitResolution(): void {
    if (!this.occurrence || !this.canInformResolution || !this.resolutionStatement.trim()) {
      this.errorMessage = 'Descreva a resolução informada.';
      return;
    }

    this.runWithOptionalEvidence(
      (evidenceIds) =>
        this.postService.informOccurrenceResolution(
          this.occurrence!,
          this.user,
          this.resolutionStatement.trim(),
          evidenceIds,
        ),
      'Resolução informada e preservada no histórico.',
    );
  }

  submitResolve(): void {
    if (!this.occurrence || !this.canResolve || this.resolutionReviewNote.trim().length < 20) {
      this.errorMessage = 'Descreva a verificação da resolução (mínimo de 20 caracteres).';
      return;
    }

    this.runAction(
      () => this.postService.reviewForwardingResponse(this.occurrence!, this.user, this.responseCode, this.resolutionReviewNote.trim()),
      'Resposta analisada e classificação registrada no histórico.',
    );
  }

  submitAnalysis(): void {
    if (!this.occurrence || !this.canStartAnalysis) return;
    if (this.analysisNote.trim().length < 20) {
      this.errorMessage = 'Descreva a ação iniciada em pelo menos 20 caracteres.';
      return;
    }
    this.runAction(
      () => this.postService.startOccurrenceAnalysis(this.occurrence!, this.user, this.analysisNote.trim(), this.analysisReference.trim() || undefined),
      'Análise iniciada e registrada no histórico.',
    );
  }

  submitContest(): void {
    if (!this.occurrence || !this.canContest || !this.contestReason.trim()) {
      this.errorMessage = 'Explique por que a resolução está sendo contestada.';
      return;
    }

    this.runWithOptionalEvidence(
      (evidenceIds) =>
        this.postService.contestOccurrenceResolution(
          this.occurrence!,
          this.user,
          this.contestReason.trim(),
          evidenceIds,
        ),
      'Contestação registrada e resolução anterior preservada.',
    );
  }

  submitReopen(): void {
    if (!this.occurrence || !this.canReopen || !this.reopenReason.trim()) {
      this.errorMessage = 'Informe por que a ocorrência deve ser reaberta.';
      return;
    }

    this.runAction(
      () => this.postService.reopenOccurrenceFlow(this.occurrence!, this.user, this.reopenReason.trim()),
      'Ocorrência reaberta para novo ciclo de acompanhamento.',
    );
  }

  formatStatus(): string {
    return this.occurrence ? occurrenceStage(this.occurrence.status) : '';
  }

  get statusDetail(): string {
    return this.occurrence ? OCCURRENCE_STATUS_DETAILS[this.occurrence.status] : '';
  }

  formatCategory(): string {
    return this.postService.getCategoryLabel(this.occurrence?.category);
  }

  formatImportance(): string {
    return this.occurrence ? this.postService.getImportanceLabel(this.occurrence.importance) : '';
  }

  formatEvent(eventType: OccurrenceEventType): string {
    const labels: Record<OccurrenceEventType, string> = {
      ANALISE_DE_COMPETENCIA_INICIADA: 'Análise de competência iniciada',
      MODERACAO_NECESSARIA: 'Análise da moderação necessária',
      OCORRENCIA_REENVIADA: 'Ocorrência reenviada',
      RESPOSTA_CLASSIFICADA: 'Resposta analisada pela moderação',
      OCORRENCIA_CRIADA: 'Ocorrência criada',
      OCCURRENCE_UPDATED: 'Ocorrência atualizada',
      COMMENT_ADDED: 'Comentário adicionado',
      COMMENT_EDITED: 'Comentário editado',
      COMMENT_REMOVED: 'Comentário removido',
      EVIDENCIA_ADICIONADA: 'Nova evidência',
      EVIDENCIA_ACEITA: 'Evidência aceita',
      EVIDENCIA_REJEITADA: 'Evidência rejeitada',
      OCORRENCIA_CONFIRMADA: 'Também identificado',
      ORGAO_RESPONSAVEL_IDENTIFICADO: 'Órgão responsável identificado',
      ORGAO_RESPONSAVEL_SUGERIDO: 'Órgão responsável sugerido',
      AGENCY_NOT_IDENTIFIED: 'Órgão não identificado',
      OCORRENCIA_ENCAMINHADA: 'Ocorrência encaminhada',
      ENCAMINHAMENTO_FALHOU: 'Encaminhamento falhou',
      FORWARDING_RESPONSE_REGISTERED: 'Resposta do órgão registrada',
      PROTOCOL_REGISTERED: 'Protocolo recebido',
      ANALISE_INICIADA: 'Análise iniciada',
      RESOLUCAO_INFORMADA: 'Resolução informada',
      OCORRENCIA_RESOLVIDA: 'Ocorrência resolvida',
      RESOLUCAO_CONTESTADA: 'Resolução contestada',
      OCORRENCIA_REABERTA: 'Ocorrência reaberta',
      MODERATION_APPLIED: 'Moderação registrada',
    };

    return labels[eventType];
  }

  statusLabel(status = this.occurrence?.status): string {
    return status ? this.postService.getStatusLabel(status) : 'Não informado';
  }

  formatDate(date: string): string {
    if (!date) {
      return 'Não informado';
    }

    return new Intl.DateTimeFormat(this.i18n.language(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  eventDescription(event: OccurrenceHistoryEvent): string {
    if (event.description && ['ANALISE_DE_COMPETENCIA_INICIADA', 'MODERACAO_NECESSARIA', 'OCORRENCIA_REENVIADA', 'RESPOSTA_CLASSIFICADA'].includes(event.eventType)) return event.description;
    const metadata = event.metadata ?? {};

    if (event.eventType === 'OCORRENCIA_ENCAMINHADA') {
      const agencyName = String(metadata['agencyName'] ?? 'órgão responsável');
      return metadata['protocol']
        ? this.i18n.translate('Encaminhada para {agency}. Protocolo: {protocol}.', { agency: agencyName, protocol: metadata['protocol'] })
        : this.i18n.translate('Encaminhada para {agency}.', { agency: agencyName });
    }

    if (event.eventType === 'ENCAMINHAMENTO_FALHOU') {
      return 'A tentativa falhou e pode ser refeita.';
    }

    if (event.eventType === 'RESOLUCAO_INFORMADA') {
      const source = event.actorType === 'RESPONSIBLE_AGENCY' ? 'O órgão responsável' : 'A comunidade';
      return `${this.i18n.translate('{source} informou que o problema foi solucionado.', { source: this.i18n.translate(source) })} ${String(metadata['statement'] ?? '')}`.trim();
    }

    if (event.eventType === 'ANALISE_INICIADA') {
      return [this.i18n.translate(event.description), metadata['note'], metadata['reference'] ? this.i18n.translate('Referência: {reference}', { reference: metadata['reference'] }) : ''].filter(Boolean).join(' ') || this.i18n.translate('O órgão responsável iniciou a análise.');
    }

    if (event.eventType === 'OCORRENCIA_RESOLVIDA') {
      return metadata['note'] ? `${this.i18n.translate('A ocorrência foi marcada como resolvida.')} ${metadata['note']}` : 'A ocorrência foi marcada como resolvida.';
    }

    if (event.eventType === 'OCORRENCIA_CRIADA') {
      return this.i18n.translate('{actor} criou esta ocorrência.', { actor: event.actorName ?? this.occurrence?.authorName ?? this.i18n.translate('Um usuário') });
    }

    if (event.eventType === 'ORGAO_RESPONSAVEL_IDENTIFICADO') {
      return this.i18n.translate('{agency} foi identificado como responsável pela ocorrência.', { agency: metadata['agencyName'] ?? this.i18n.translate('Um órgão') });
    }

    if (event.eventType === 'ORGAO_RESPONSAVEL_SUGERIDO') {
      return this.i18n.translate('{agency} foi sugerido pela comunidade.', { agency: metadata['agencyName'] ?? this.i18n.translate('Um órgão') });
    }

    if (event.eventType === 'EVIDENCIA_ACEITA') return 'O criador da ocorrência aceitou a evidência.';
    if (event.eventType === 'EVIDENCIA_REJEITADA') return 'O criador da ocorrência rejeitou a evidência.';

    if (event.eventType === 'EVIDENCIA_ADICIONADA') {
      return 'Uma nova evidência foi adicionada à ocorrência.';
    }

    if (event.eventType === 'RESOLUCAO_CONTESTADA') {
      return String(metadata['reason'] ?? 'Um usuário informou que o problema continua existindo.');
    }

    if (event.eventType === 'OCORRENCIA_REABERTA') {
      return String(metadata['reason'] ?? 'A ocorrência voltou ao acompanhamento.');
    }

    return event.description ?? 'A ocorrência foi atualizada.';
  }

  eventOrigin(event: OccurrenceHistoryEvent): string {
    if (event.actorType === 'RESPONSIBLE_AGENCY') return 'Órgão responsável';
    if (event.actorType === 'SYSTEM') return 'Sistema';
    if (event.actorType === 'MODERATOR') return 'Moderação';
    return 'Comunidade';
  }

  eventOriginClass(event: OccurrenceHistoryEvent): string {
    if (event.actorType === 'RESPONSIBLE_AGENCY') return 'agency';
    if (event.actorType === 'SYSTEM') return 'system';
    if (event.actorType === 'MODERATOR') return 'moderation';
    return 'community';
  }

  eventActorLine(event: OccurrenceHistoryEvent): string {
    if (event.actorType === 'SYSTEM') {
      return 'Sistema';
    }

    const actorName =
      event.actorName ||
      (event.actorType === 'RESPONSIBLE_AGENCY' ? this.occurrence?.responsibleAgency?.name : '') ||
      (event.eventType === 'OCORRENCIA_CRIADA' ? this.occurrence?.authorName : '');

    return actorName ? `${actorName} · ${this.i18n.translate(this.eventOrigin(event))}` : this.eventOrigin(event);
  }

  eventEvidences(event: OccurrenceHistoryEvent): OccurrenceEvidence[] {
    const evidenceIds = event.evidenceIds ?? [];

    if (!evidenceIds.length || !this.occurrence?.evidences.length) {
      return [];
    }

    return this.occurrence.evidences.filter((evidence) => evidenceIds.includes(evidence.id));
  }

  shareOccurrence(): void {
    if (!this.occurrence) {
      return;
    }

    const link = `${window.location.origin}/occurrences/${encodeURIComponent(this.occurrence.id)}`;

    if (navigator.share) {
      void navigator
        .share({
          title: this.occurrence.title,
          text: this.occurrence.content,
          url: link,
        })
        .then(() => {
          this.successMessage = 'Link da ocorrência compartilhado.';
          this.errorMessage = '';
        })
        .catch(() => this.copyOccurrenceLink(link));
      return;
    }

    this.copyOccurrenceLink(link);
  }

  private runWithOptionalEvidence(
    action: (evidenceIds: string[]) => Observable<SpectrumPost>,
    successMessage: string,
  ): void {
    if (!this.occurrence || !this.evidenceFile) {
      this.runAction(() => action([]), successMessage);
      return;
    }

    this.isSubmitting.set(true);
    this.postService
      .uploadEvidence(this.evidenceFile)
      .pipe(
        switchMap((upload) =>
          this.postService.addOccurrenceEvidence(this.occurrence!, this.user, {
            type: upload.type,
            url: upload.url,
            description: this.evidenceDescription || this.evidenceFile?.name,
          }),
        ),
        switchMap((updated) => {
          this.occurrence = updated;
          const evidence = updated.evidences.at(-1);
          const evidenceId = evidence && (!evidence.status || evidence.status === 'APPROVED') ? evidence.id : undefined;
          return action(evidenceId ? [evidenceId] : []);
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (occurrence) => this.afterAction(occurrence, successMessage),
        error: (error: unknown) => this.afterActionError(error),
      });
  }

  private runAction(action: () => Observable<SpectrumPost>, successMessage: string): void {
    if (this.isSubmitting()) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting.set(true);
    defer(action)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (occurrence) => this.afterAction(occurrence, successMessage),
        error: (error: unknown) => this.afterActionError(error),
      });
  }

  private afterAction(occurrence: SpectrumPost, message: string): void {
    this.occurrence = occurrence;
    this.historyEvents = occurrence.history;
    this.successMessage = message;
    this.errorMessage = '';
    this.actionPanel = null;
    this.responseMessage = '';
    this.responseProtocol = '';
    this.receivedResponseCode = '';
    this.evidenceFile = null;
    this.evidenceDescription = '';
    this.forwardingDeliveryConfirmed = false;
    this.postService.getOccurrenceHistory(occurrence.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => {
          this.historyEvents = history;
          this.occurrence = this.withHistoryAuthor(occurrence, history);
        },
        error: (error: unknown) => { this.errorMessage = this.getErrorMessage(error); },
      });
  }

  private afterActionError(error: unknown): void {
    this.errorMessage = this.getErrorMessage(error);
    if (!this.occurrence) return;
    forkJoin({
      occurrence: this.postService.getOccurrence(this.occurrence.id, this.user),
      history: this.postService.getOccurrenceHistory(this.occurrence.id),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ occurrence, history }) => {
        this.occurrence = this.withHistoryAuthor(occurrence, history);
        this.historyEvents = history;
      },
      error: () => { /* Keep the original action error and last confirmed state. */ },
    });
  }

  private withHistoryAuthor(occurrence: SpectrumPost, history: OccurrenceHistoryEvent[]): SpectrumPost {
    const authorName = history.find((event) => event.eventType === 'OCORRENCIA_CRIADA')?.actorName;
    return authorName ? { ...occurrence, authorName } : occurrence;
  }

  selectRegisteredAgency(): void {
    const agency = this.registeredAgencies.find(item => item._id === this.agencyId);
    this.agencyName = agency?.name ?? '';
    this.agencyEmail = agency?.emails[0] ?? '';
  }

  get registeredContacts(): string[] {
    return this.registeredAgencies.find(item => item._id === this.agencyId)?.emails ?? [];
  }

  get moderationLabel(): string {
    const labels: Record<string, string> = {
      EMPATE_DE_ORGAO_RESPONSAVEL: 'Empate de órgão responsável', ORGAO_NAO_IDENTIFICADO: 'Órgão não identificado',
      CONTATO_INVALIDO: 'Órgão sem contato válido', FALHA_NO_ENCAMINHAMENTO: 'Falha no encaminhamento',
      SEM_RETORNO_APOS_REENVIO: 'Sem retorno após o reenvio', RESPOSTA_EM_APURACAO: 'Resposta aguardando análise',
      REJEITADA_PARA_REAVALIACAO: 'Ocorrência rejeitada e aguardando reavaliação',
      ENVIO_INTERROMPIDO: 'Envio aguardando conferência da moderação', PROCESSAMENTO_INTERROMPIDO: 'Processamento aguardando conferência da moderação',
    };
    return labels[this.occurrence?.moderationReason ?? ''] ?? '';
  }

  private buildAgency(): OccurrenceAgency {
    return {
      id: this.agencyId.trim() || undefined,
      name: this.agencyName.trim(),
      email: this.agencyEmail || undefined,
      hasIntegration: false,
    };
  }

  private prefillAgency(agency?: OccurrenceAgency): void {
    this.agencyId = agency?.id ?? '';
    this.agencyName = agency?.name ?? '';
    this.agencyEmail = agency?.email ?? '';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      if (Array.isArray(apiMessage)) return apiMessage.join(' ');
      if (typeof apiMessage === 'string') return apiMessage;
    }

    return error instanceof Error ? error.message : 'Não foi possível executar a ação.';
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }

  private copyOccurrenceLink(link: string): void {
    void navigator.clipboard
      .writeText(link)
      .then(() => {
        this.successMessage = 'Link da ocorrência copiado.';
        this.errorMessage = '';
      })
      .catch(() => {
        this.errorMessage = link;
      });
  }
}
