import { isValidCnpj } from './cnpj';
describe('CNPJ form validation', () => {
  it.each(['04.252.011/0001-10', '12.ABC.345/01DE-35', '00.000.000/E08G-12'])(
    'accepts official numeric and alphanumeric examples: %s',
    (value) => expect(isValidCnpj(value)).toBe(true),
  );
  it.each([
    '00000000000000',
    '11111111111111',
    '12.ABC.345/01DE-36',
    '12.ABC.345/01DE-AA',
    '12345678901',
  ])('rejects invalid identification: %s', (value) => expect(isValidCnpj(value)).toBe(false));
});
