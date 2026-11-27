import type { LoggedUser } from '../user/user.service';
import type { OccurrenceStatus } from './post.service';

export type OccurrenceStage = 'Aberta' | 'Em andamento' | 'Fechada';

// Preserve the API statuses while presenting three understandable stages.
export function occurrenceStage(status: OccurrenceStatus): OccurrenceStage {
  if (status === 'RESOLVIDA') return 'Fechada';
  if (['ENCAMINHADA', 'EM_ANALISE', 'RESOLUCAO_INFORMADA', 'RESOLUCAO_EM_ANALISE', 'CONTESTADA', 'EM_ANALISE_DE_COMPETENCIA', 'FALHA_NO_ENCAMINHAMENTO', 'RESPOSTA_EM_APURACAO', 'EM_RESOLUCAO', 'REJEITADA'].includes(status)) {
    return 'Em andamento';
  }
  return 'Aberta';
}

export const OCCURRENCE_STATUS_DETAILS: Record<OccurrenceStatus, string> = {
  AGUARDANDO_ENCAMINHAMENTO: 'Aguardando encaminhamento',
  EM_ANALISE_DE_COMPETENCIA: 'Em análise de competência',
  FALHA_NO_ENCAMINHAMENTO: 'Falha no encaminhamento',
  RESPOSTA_EM_APURACAO: 'Resposta em apuração',
  EM_RESOLUCAO: 'Ocorrência em resolução',
  REJEITADA: 'Ocorrência rejeitada',
  ABERTA: 'Aguardando acompanhamento',
  ENCAMINHADA: 'Encaminhada',
  EM_ANALISE: 'Análise iniciada pelo órgão responsável',
  RESOLUCAO_EM_ANALISE: 'Resolução em análise',
  RESOLUCAO_INFORMADA: 'Solução informada; aguardando verificação',
  RESOLVIDA: 'Ocorrência resolvida',
  CONTESTADA: 'Solução contestada; aguardando reabertura',
  REABERTA: 'Reaberta para um novo acompanhamento',
  SEM_ORGAO_IDENTIFICADO: 'Aguardando identificação do órgão responsável',
};

export const IMPORTANCE_GUIDANCE = {
  BAIXA: 'Impacto limitado, sem impedir o uso do espaço.',
  MEDIA: 'Prejudica a circulação ou o uso do local, mas existe alternativa.',
  ALTA: 'Risco à segurança ou impedimento de acesso essencial. Descreva o impacto observado.',
  CRITICA: 'Risco à segurança ou impedimento de acesso essencial. Descreva o impacto observado.',
};

export function representsOccurrenceAgency(user: LoggedUser | null | undefined, agencyId?: string): boolean {
  return !!agencyId && (
    (user?.accountType === 'PUBLIC_AGENCY' && user._id === agencyId) ||
    (user?.occurrenceRole === 'RESPONSIBLE_AGENCY' && user.occurrenceAgencyId === agencyId)
  );
}

export function canProposeAgencyResolution(
  user: LoggedUser | null | undefined,
  post: { responsibleAgency?: { id?: string } | null; status: string; createdAt: string },
): boolean {
  return representsOccurrenceAgency(user, post.responsibleAgency?.id) &&
    Date.now() >= new Date(post.createdAt).getTime() + 15 * 60_000 &&
    !['RESOLVIDA', 'CONTESTADA', 'RESOLUCAO_EM_ANALISE'].includes(post.status);
}
