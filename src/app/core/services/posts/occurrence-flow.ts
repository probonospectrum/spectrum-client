import type { OccurrenceStatus } from './post.service';

export type OccurrenceStage = 'Aberta' | 'Em andamento' | 'Fechada';

// Preserve the API statuses while presenting three understandable stages.
export function occurrenceStage(status: OccurrenceStatus): OccurrenceStage {
  if (status === 'RESOLVIDA') return 'Fechada';
  if (['ENCAMINHADA', 'EM_ANALISE', 'RESOLUCAO_INFORMADA', 'CONTESTADA'].includes(status)) {
    return 'Em andamento';
  }
  return 'Aberta';
}

export const OCCURRENCE_STATUS_DETAILS: Record<OccurrenceStatus, string> = {
  ABERTA: 'Aguardando acompanhamento',
  ENCAMINHADA: 'Encaminhamento registrado; aguardando resposta',
  EM_ANALISE: 'Análise iniciada pelo órgão responsável',
  RESOLUCAO_INFORMADA: 'Solução informada; aguardando verificação',
  RESOLVIDA: 'Resolução confirmada',
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
