import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, defer, finalize, forkJoin, switchMap } from 'rxjs';
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

import { occurrenceStage, OCCURRENCE_STATUS_DETAILS } from '../../../core/services/posts/occurrence-flow';

type ActionPanel =
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
  supportCount: number;
}

@Component({
  selector: 'app-occurrence-detail-page',
  imports: [CommonModule, FormsModule, RouterLink, CommentSection, LoadingIndicator],
  templateUrl: './occurrence-detail-page.html',
  styleUrl: './occurrence-detail-page.scss',
})
export class OccurrenceDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
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
  forwardingChannel: OccurrenceForwardingChannel = 'WEBSITE';
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
  agencyDirectory: OccurrenceAgencyOption[] = [];
  agencyDirectorySearch = '';
  agencySuggestionSearch = '';
  agencySuggestionOrder: 'most' | 'least' = 'most';
  readonly agencyDirectoryLoading = signal(false);
  private agencyDirectoryLoaded = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.currentOccurrenceId = id ?? '';

    this.loadOccurrence();
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
          this.historyEvents = this.isMockOccurrence ? occurrence.history : history;
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
    return this.historyEvents.filter(event => this.isOccurrenceAuthor || event.eventType !== 'ORGAO_RESPONSAVEL_SUGERIDO').sort(
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

  get isOccurrenceAuthor(): boolean {
    return Boolean(this.user?._id && this.user._id === this.occurrence?.createdBy);
  }

  get agencySuggestions(): AgencySuggestion[] {
    const groups = new Map<string, AgencySuggestion & { participants: Map<string, string> }>();
    for (const event of this.timeline) {
      if (event.eventType !== 'ORGAO_RESPONSAVEL_SUGERIDO') continue;
      const agency = event.metadata?.['agency'] as OccurrenceAgency | undefined;
      const name = (agency?.name || String(event.metadata?.['agencyName'] ?? '')).trim();
      if (!name) continue;
      const key = agency?.id || this.normalizeSearch(name).replace(/\s+/g, ' ');
      const participantName = event.actorName || event.actorOrigin || 'Usuário da comunidade';
      // Events without an actor identifier do not establish distinct supporters.
      const participantKey = event.actorId || 'unknown';
      let group = groups.get(key);
      if (!group) {
        group = { event, agency: { id: agency?.id, name }, suggestedBy: '', supportCount: 0, participants: new Map() };
        groups.set(key, group);
      }
      group.participants.set(participantKey, participantName);
      group.suggestedBy = [...group.participants.values()].join(', ');
      group.supportCount = [...group.participants.keys()].filter(id => id !== 'unknown').length;
    }
    return [...groups.values()].sort((first, second) =>
      second.supportCount - first.supportCount || first.agency.name.localeCompare(second.agency.name, 'pt-BR'),
    );
  }

  get filteredAgencySuggestions(): AgencySuggestion[] {
    const query = this.normalizeSearch(this.agencySuggestionSearch);
    return this.agencySuggestions
      .filter(({ agency, suggestedBy }) => !query || this.normalizeSearch(`${agency.name} ${suggestedBy}`).includes(query))
      .sort((first, second) =>
        (this.agencySuggestionOrder === 'most'
          ? second.supportCount - first.supportCount
          : first.supportCount - second.supportCount) || first.agency.name.localeCompare(second.agency.name, 'pt-BR'),
      );
  }

  get filteredAgencyDirectory(): OccurrenceAgencyOption[] {
    const query = this.normalizeSearch(this.agencyDirectorySearch);
    if (!query) return this.agencyDirectory;

    return this.agencyDirectory.filter((agency) =>
      this.normalizeSearch([
        agency.name,
        agency.stateCode,
        ...(agency.cities ?? []),
        ...(agency.categories ?? []),
      ].join(' ')).includes(query),
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
    return this.isCommunityUser && !['RESOLVIDA'].includes(this.occurrence?.status ?? '');
  }

  get canSuggestAgency(): boolean {
    return this.isCommunityUser && !['RESOLVIDA'].includes(this.occurrence?.status ?? '');
  }

  get canAssociateAgency(): boolean {
    return this.isModerator && !['RESOLVIDA'].includes(this.occurrence?.status ?? '');
  }

  get canAssumeResponsibility(): boolean {
    return (
      this.isResponsibleAgencyForOccurrence &&
      ['ABERTA', 'ENCAMINHADA', 'EM_ANALISE', 'REABERTA', 'SEM_ORGAO_IDENTIFICADO'].includes(
        this.occurrence?.status ?? '',
      )
    );
  }

  get canForward(): boolean {
    return this.isModerator && ['ABERTA', 'REABERTA', 'SEM_ORGAO_IDENTIFICADO'].includes(this.occurrence?.status ?? '');
  }

  get canRegisterForwardingFailure(): boolean {
    return this.isModerator && ['ABERTA', 'REABERTA'].includes(this.occurrence?.status ?? '');
  }

  get canShowCommunityActions(): boolean {
    return (
      this.isCommunityUser &&
      (this.canConfirmCommunity || this.canAddEvidence || this.canSuggestAgency || this.canInformResolution)
    );
  }

  get canShowAgencyActions(): boolean {
    return (
      this.isResponsibleAgencyForOccurrence &&
      (this.canAssumeResponsibility || this.canStartAnalysis || this.canInformResolution)
    );
  }

  get canShowModeratorActions(): boolean {
    return this.canAssociateAgency || this.canForward || this.canRegisterForwardingFailure;
  }

  get hasAvailableActions(): boolean {
    return this.canShowCommunityActions || this.canShowAgencyActions || this.canShowModeratorActions || this.canResolve || this.canContest || this.canReopen;
  }

  get agencyActionLabel(): string {
    return this.canAssociateAgency ? 'Associar órgão' : 'Sugerir órgão responsável';
  }

  get agencySubmitLabel(): string {
    return this.canAssociateAgency ? 'Salvar órgão' : 'Enviar sugestão';
  }

  get canInformResolution(): boolean {
    if (!this.isCommunityUser && !this.isResponsibleAgencyForOccurrence) {
      return false;
    }

    return ['ABERTA', 'ENCAMINHADA', 'EM_ANALISE', 'REABERTA'].includes(
      this.occurrence?.status ?? '',
    );
  }

  get canResolve(): boolean {
    return this.occurrence?.status === 'RESOLUCAO_INFORMADA' && (this.isModerator || this.isResponsibleAgencyForOccurrence);
  }

  get canStartAnalysis(): boolean {
    return this.occurrence?.status === 'ENCAMINHADA' && this.isResponsibleAgencyForOccurrence;
  }

  get canContest(): boolean {
    return this.isCommunityUser && this.occurrence?.status === 'RESOLVIDA';
  }

  get canReopen(): boolean {
    return this.isCommunityUser && this.occurrence?.status === 'CONTESTADA';
  }

  get responsibleAgencyLabel(): string {
    return this.displayAgencyName(this.occurrence?.responsibleAgency?.name || 'Órgão responsável ainda não identificado');
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
    if (panel === 'agency' || panel === 'forward' || panel === 'forwardFailure') {
      this.loadAgencyDirectory();
    }
  }

  acceptAgencySuggestion(suggestion: AgencySuggestion): void {
    if (!this.occurrence || !this.canAcceptAgencySuggestion(suggestion)) return;

    this.runAction(
      () => this.postService.acceptAgencySuggestion(
        this.occurrence!,
        this.user,
        suggestion.agency.id!,
      ),
      this.isMockOccurrence ? `Órgão de exemplo escolhido: ${this.displayAgencyName(suggestion.agency.name)}. Nenhum encaminhamento real foi realizado.` : `Ocorrência encaminhada para ${this.displayAgencyName(suggestion.agency.name)}.`,
    );
  }

  canAcceptAgencySuggestion(suggestion: AgencySuggestion): boolean {
    const createdAt = Date.parse(this.occurrence?.createdAt ?? '');
    return Boolean(
      this.isOccurrenceAuthor &&
        this.isRegisteredAgencySuggestion(suggestion) &&
        (this.isMockOccurrence || (Number.isFinite(createdAt) && Date.now() - createdAt >= 15 * 60 * 1000)) &&
        [
          'ABERTA',
          'SEM_ORGAO_IDENTIFICADO',
          'AGUARDANDO_ENCAMINHAMENTO',
          'EM_ANALISE_DE_COMPETENCIA',
          'FALHA_NO_ENCAMINHAMENTO',
        ].includes(this.occurrence?.status ?? '') &&
        !this.hasSuccessfulAgencyForwarding,
    );
  }

  isRegisteredAgencySuggestion(suggestion: AgencySuggestion): boolean {
    return this.isMockOccurrence
      ? this.postService.mockAgencies.some(agency => agency.id === suggestion.agency.id)
      : /^[a-f\d]{24}$/i.test(suggestion.agency.id ?? '');
  }

  get hasSuccessfulAgencyForwarding(): boolean {
    return Boolean(this.occurrence?.forwardingHistory.some((forwarding) => forwarding.success));
  }

  get isAgencySelectionOnHold(): boolean {
    const createdAt = Date.parse(this.occurrence?.createdAt ?? '');
    return Number.isFinite(createdAt) && Date.now() - createdAt < 15 * 60 * 1000;
  }

  selectAgencyFromDirectory(agencyId: string): void {
    const agency = this.agencyDirectory.find((item) => item.id === agencyId);
    this.agencyName = agency?.name ?? '';
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
        next: (occurrence) => this.afterAction(occurrence, 'Evidência adicionada ao histórico.'),
        error: (error: unknown) => (this.errorMessage = this.getErrorMessage(error)),
      });
  }

  submitAgency(): void {
    if (!this.occurrence || (!this.canAssociateAgency && !this.canSuggestAgency) || (!this.agencyId && !this.canSuggestAgency) || !this.agencyName.trim()) {
      this.errorMessage = this.canSuggestAgency ? 'Informe o nome do órgão sugerido.' : 'Selecione um órgão cadastrado.';
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
      : 'Sugestão enviada para avaliação do autor da ocorrência.';

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
    if (!this.occurrence || !this.canForward || !this.agencyId || !this.agencyName.trim() || this.forwardingContent.trim().length < 20) {
      this.errorMessage = 'Selecione o órgão e descreva o encaminhamento em pelo menos 20 caracteres.';
      return;
    }
    if (!['WEBSITE', 'PHONE', 'IN_PERSON', 'OTHER'].includes(this.forwardingChannel) || !this.forwardingDeliveryConfirmed) {
      this.errorMessage = 'Confirme o registro manual do encaminhamento por um dos canais disponíveis.';
      return;
    }

    this.runAction(
      () => this.postService.forwardOccurrence(this.occurrence!, this.user, {
        agency: this.buildAgency(),
        channel: this.forwardingChannel,
        sentContent: this.forwardingContent.trim(),
        protocol: this.forwardingProtocol.trim() || undefined,
        deliveryConfirmed: this.forwardingDeliveryConfirmed,
      }),
      'Ocorrência encaminhada e registrada na timeline.',
    );
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
      () => this.postService.resolveOccurrence(
        this.occurrence!,
        this.user,
        this.resolutionReviewNote.trim(),
      ),
      'Ocorrência marcada como resolvida com evento próprio.',
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
      OCORRENCIA_CRIADA: 'Ocorrência criada',
      OCCURRENCE_UPDATED: 'Ocorrência atualizada',
      COMMENT_ADDED: 'Comentário adicionado',
      COMMENT_EDITED: 'Comentário editado',
      COMMENT_REMOVED: 'Comentário removido',
      EVIDENCIA_ADICIONADA: 'Nova evidência',
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

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  eventDescription(event: OccurrenceHistoryEvent): string {
    const metadata = event.metadata ?? {};

    if (event.eventType === 'OCORRENCIA_ENCAMINHADA') {
      const agencyName = String(metadata['agencyName'] ?? 'órgão responsável');
      return metadata['protocol']
        ? `Encaminhada para ${agencyName}. Protocolo: ${metadata['protocol']}.`
        : `Encaminhada para ${agencyName}.`;
    }

    if (event.eventType === 'ENCAMINHAMENTO_FALHOU') {
      return 'A tentativa falhou e pode ser refeita.';
    }

    if (event.eventType === 'RESOLUCAO_INFORMADA') {
      const source = event.actorType === 'RESPONSIBLE_AGENCY' ? 'O órgão responsável' : 'A comunidade';
      return `${source} informou que o problema foi solucionado. ${String(metadata['statement'] ?? '')}`.trim();
    }

    if (event.eventType === 'ANALISE_INICIADA') {
      return [event.description, metadata['note'], metadata['reference'] ? `Referência: ${metadata['reference']}` : ''].filter(Boolean).join(' ') || 'O órgão responsável iniciou a análise.';
    }

    if (event.eventType === 'OCORRENCIA_RESOLVIDA') {
      return metadata['note'] ? `A ocorrência foi marcada como resolvida. ${metadata['note']}` : 'A ocorrência foi marcada como resolvida.';
    }

    if (event.eventType === 'OCORRENCIA_CRIADA') {
      return `${event.actorName ?? this.occurrence?.authorName ?? 'Um usuário'} criou esta ocorrência.`;
    }

    if (event.eventType === 'ORGAO_RESPONSAVEL_IDENTIFICADO') {
      return `${this.displayAgencyName(String(metadata['agencyName'] ?? 'Um órgão'))} foi identificado como responsável pela ocorrência.`;
    }

    if (event.eventType === 'ORGAO_RESPONSAVEL_SUGERIDO') {
      const agency = metadata['agency'] as OccurrenceAgency | undefined;
      return `${this.displayAgencyName(String(metadata['agencyName'] ?? agency?.name ?? 'Um órgão'))} foi sugerido pela comunidade.`;
    }

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
      event.actorOrigin ||
      (event.actorType === 'RESPONSIBLE_AGENCY' ? this.occurrence?.responsibleAgency?.name : '') ||
      (event.eventType === 'OCORRENCIA_CRIADA' ? this.occurrence?.authorName : '');

    return actorName ? `${actorName} · ${this.eventOrigin(event)}` : this.eventOrigin(event);
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
          const evidenceId = updated.evidences[updated.evidences.length - 1]?.id;
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
    this.evidenceFile = null;
    this.evidenceDescription = '';
    this.forwardingDeliveryConfirmed = false;
    this.postService.getOccurrenceHistory(occurrence.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => {
          this.historyEvents = this.isMockOccurrence ? occurrence.history : history;
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

  private buildAgency(): OccurrenceAgency {
    return {
      id: this.canSuggestAgency && this.agencyDirectoryLoadedEmpty ? undefined : this.agencyId.trim() || undefined,
      name: this.agencyName.trim(),
      hasIntegration: false,
    };
  }

  get agencyDirectoryLoadedEmpty(): boolean {
    return this.agencyDirectoryLoaded && this.agencyDirectory.length === 0;
  }

  private loadAgencyDirectory(): void {
    if (this.agencyDirectoryLoaded || this.agencyDirectoryLoading()) return;

    this.agencyDirectoryLoading.set(true);
    this.postService
      .getResponsibleAgencies(this.occurrence?.id)
      .pipe(
        finalize(() => this.agencyDirectoryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (agencies) => {
          this.agencyDirectory = agencies;
          if (!agencies.length && this.canSuggestAgency) {
            this.agencyId = '';
            this.agencyName = '';
          }
          this.agencyDirectoryLoaded = true;
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error);
        },
      });
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
  }

  private prefillAgency(agency?: OccurrenceAgency): void {
    this.agencyId = agency?.id ?? '';
    this.agencyName = agency?.name ?? '';
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
