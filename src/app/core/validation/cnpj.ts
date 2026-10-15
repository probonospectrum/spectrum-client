// Receita Federal: 12 alphanumeric positions + 2 numeric check digits; ASCII - 48.
export function normalizeCnpj(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[.\/-]/g, '');
}
export function isValidCnpj(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const cnpj = normalizeCnpj(value);
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digit = (base: string): string => {
    const sum = [...base].reduce(
      (total, char, index) =>
        total + (char.charCodeAt(0) - 48) * (2 + ((base.length - 1 - index) % 8)),
      0,
    );
    const remainder = sum % 11;
    return String(remainder < 2 ? 0 : 11 - remainder);
  };
  const first = digit(cnpj.slice(0, 12));
  return cnpj.slice(-2) === first + digit(cnpj.slice(0, 12) + first);
}
