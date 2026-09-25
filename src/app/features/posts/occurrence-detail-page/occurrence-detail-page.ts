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
  agencyEmail = '';
  forwardingChannel: OccurrenceForwardingChannel = 'EMAIL';
  registeredAgencies: { _id: string; name: string; emails: string[] }[] = [];
  responseCode = '02';
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
    if (this.isModerator) this.postService.getRegisteredAgencies().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: agencies => this.registeredAgencies = agencies,
      error: error => this.errorMessage = this.getErrorMessage(error),
    });
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
    return [...this.historyEvents].sort(
      (first, second) =>
        new Date(first.createdAt ?? first.occurredAt).getTime() - new Date(second.createdAt ?? second.occurredAt).getTime(),
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
    return this.canAssociateAgency ? 'Selecionar e encaminhar' : 'Enviar sugestão';
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
    if (!this.occurrence || (!this.canAssociateAgency && !this.canSuggestAgency) || !this.agencyName.trim()) {
      this.errorMessage = 'Informe o nome do órgão responsável.';
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
    if (!this.occurrence || !this.canForward || !this.agencyId) {
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
    if (event.description && ['ANALISE_DE_COMPETENCIA_INICIADA', 'MODERACAO_NECESSARIA', 'OCORRENCIA_REENVIADA', 'RESPOSTA_CLASSIFICADA'].includes(event.eventType)) return event.description;
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
      return `${String(metadata['agencyName'] ?? 'Um órgão')} foi identificado como responsável pela ocorrência.`;
    }

    if (event.eventType === 'ORGAO_RESPONSAVEL_SUGERIDO') {
      return `${String(metadata['agencyName'] ?? 'Um órgão')} foi sugerido pela comunidade.`;
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
