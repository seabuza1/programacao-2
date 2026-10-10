import { describe, expect, it } from 'vitest';
import { dividirArredondado } from './arredondamento';

describe('dividirArredondado', () => {
  it('arredonda meio para cima', () => {
    expect(dividirArredondado(5n, 2n)).toBe(3n);
    expect(dividirArredondado(15n, 10n)).toBe(2n);
    expect(dividirArredondado(14n, 10n)).toBe(1n);
    expect(dividirArredondado(16n, 10n)).toBe(2n);
  });

  it('afasta do zero nos negativos', () => {
    expect(dividirArredondado(-5n, 2n)).toBe(-3n);
    expect(dividirArredondado(5n, -2n)).toBe(-3n);
    expect(dividirArredondado(-14n, 10n)).toBe(-1n);
    expect(dividirArredondado(-5n, -2n)).toBe(3n);
  });

  it('mantém divisão exata', () => {
    expect(dividirArredondado(100n, 4n)).toBe(25n);
    expect(dividirArredondado(0n, 7n)).toBe(0n);
  });

  it('recusa divisão por zero', () => {
    expect(() => dividirArredondado(1n, 0n)).toThrow(RangeError);
  });
});
