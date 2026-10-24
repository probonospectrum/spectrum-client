import { CONTENT_REVIEW_TERMS, requiresContentReview } from './content-policy';

describe('Content vocabulary', () => {
  it.each([...CONTENT_REVIEW_TERMS])('detects the configured term %s as a complete word or phrase', term => {
    expect(requiresContentReview(`Antes, ${term.toUpperCase()}! Depois.`)).toBe(true);
  });
  it.each(['cuzão', 'OTÁRIO', 'Sapatão', 'Ninguém vai sentir sua falta', 'foda-se', 'vou  te, matar'])('normalizes accents, whitespace and punctuation: %s', term => {
    expect(requiresContentReview(term)).toBe(true);
  });
  it.each(['O computador está quebrado.', 'Disputa pelo espaço público.', 'Rua dos Babacaias', 'O buraco precisa de manutenção.', '', 'A reportagem foi publicada.'])('does not match fragments of unrelated words: %s', text => {
    expect(requiresContentReview(text)).toBe(false);
  });
});
