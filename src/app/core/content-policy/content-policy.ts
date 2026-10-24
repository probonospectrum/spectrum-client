/** Keep this vocabulary and normalization identical in the client and server. */
export const CONTENT_REVIEW_MESSAGE = 'Revise o texto: alguns termos usados podem ferir as políticas da plataforma e a integridade de outros usuários.';

export const CONTENT_REVIEW_TERMS = [
  'porra', 'caralho', 'merda', 'buceta', 'foder', 'fodase', 'foda se', 'fdp',
  'filho da puta', 'puta', 'cuzao', 'babaca', 'idiota', 'imbecil', 'otario',
  'arrombado', 'desgraçado', 'vagabundo', 'escroto', 'lixo humano',
  'retardado', 'mongol', 'aleijado', 'crioulo', 'neguinho',
  'vadia', 'piranha', 'cadela', 'viado', 'bicha', 'sapatao', 'traveco',
  'vou te matar', 'vou te pegar', 'merece morrer', 'morra', 'te mato', 'bora matar',
  'se mata', 'vai se matar', 'se enforca', 'ninguem vai sentir sua falta',
] as const;

function normalizeContent(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
const terms = CONTENT_REVIEW_TERMS.map(term => ` ${normalizeContent(term)} `);

/** Match whole words/phrases, regardless of accents, casing or punctuation. */
export function requiresContentReview(...fields: (string | undefined | null)[]): boolean {
  return fields.some(field => {
    const text = ` ${normalizeContent(field || '')} `;
    return terms.some(term => text.includes(term));
  });
}
