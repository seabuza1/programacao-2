import { describe, expect, it } from 'vitest';
import { centavos } from './money';
import { CEM_POR_CENTO, formatarPercentual, parsePercentual, percentual, razao } from './percent';

const c = centavos;

describe('percentual', () => {
  it('guarda centésimos de %', () => {
    expect(percentual(120)).toBe(120);
    expect(CEM_POR_CENTO).toBe(10_000);
  });

  it('recusa float', () => {
    expect(() => percentual(1.2)).toThrow(RangeError);
  });
});

describe('razao', () => {
  it('calcula as participações do caso D', () => {
    const faturamento = c(371_741);
    const formas = [71_100, 158_827, 74_078, 62_236, 5_500].map((valor) =>
      razao(c(valor), faturamento),
    );
    expect(formas).toEqual([1_913, 4_273, 1_993, 1_674, 148]);
  });

  it('calcula os percentuais do DRE do caso C', () => {
    const faturamento = c(3_500_000);
    expect(razao(c(1_500_000), faturamento)).toBe(4_286);
    expect(razao(c(2_380_000), faturamento)).toBe(6_800);
    expect(razao(c(100_000), faturamento)).toBe(286);
    expect(razao(c(-480_000), faturamento)).toBe(-1_371);
  });

  it('calcula os percentuais do DRE do caso F', () => {
    const faturamento = c(371_741);
    expect(razao(c(9_684), faturamento)).toBe(261);
    expect(razao(c(362_057), faturamento)).toBe(9_739);
  });

  it('calcula os percentuais do ano no caso G', () => {
    const faturamento = c(3_871_741);
    expect(razao(c(3_571_100), faturamento)).toBe(9_223);
    expect(razao(c(-117_943), faturamento)).toBe(-305);
    expect(razao(c(500_000), faturamento)).toBe(1_291);
  });

  it('devolve null quando o total é zero', () => {
    expect(razao(c(100), c(0))).toBeNull();
    expect(razao(c(0), c(0))).toBeNull();
  });
});

describe('parsePercentual', () => {
  it.each([
    ['1,2%', 120],
    ['10,5', 1_050],
    ['24%', 2_400],
    ['9,5 %', 950],
    ['0', 0],
    ['100', 10_000],
    ['-5,5%', -550],
  ])('lê %j', (texto, esperado) => {
    expect(parsePercentual(texto)).toBe(esperado);
  });

  it.each(['', 'abc', '%', '1,234', '1.2', '1,2%%', ',5', '99999999999999999999'])(
    'recusa %j',
    (texto) => {
      expect(parsePercentual(texto)).toBeNull();
    },
  );
});

describe('formatarPercentual', () => {
  it('formata com duas casas', () => {
    expect(formatarPercentual(percentual(120))).toBe('1,20%');
    expect(formatarPercentual(percentual(4_286))).toBe('42,86%');
    expect(formatarPercentual(percentual(148))).toBe('1,48%');
    expect(formatarPercentual(percentual(0))).toBe('0,00%');
    expect(formatarPercentual(percentual(-1_371))).toBe('-13,71%');
    expect(formatarPercentual(percentual(-5))).toBe('-0,05%');
    expect(formatarPercentual(percentual(1_234_567))).toBe('12.345,67%');
  });

  it('mostra "—" na divisão por zero', () => {
    expect(formatarPercentual(razao(c(100), c(0)))).toBe('—');
  });
});
