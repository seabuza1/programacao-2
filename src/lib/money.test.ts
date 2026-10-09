import { describe, expect, it } from 'vitest';
import {
  aplicarPercentual,
  centavos,
  dividir,
  formatarReais,
  multiplicar,
  parseReais,
  somar,
  subtrair,
  ZERO,
} from './money';
import { percentual } from './percent';

const c = centavos;

describe('centavos', () => {
  it('aceita inteiros', () => {
    expect(c(123_456)).toBe(123_456);
    expect(c(-480_000)).toBe(-480_000);
    expect(ZERO).toBe(0);
  });

  it('recusa float e valores fora do inteiro seguro', () => {
    expect(() => c(19.06)).toThrow(RangeError);
    expect(() => c(Number.NaN)).toThrow(RangeError);
    expect(() => c(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => c(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('somar e subtrair', () => {
  it('soma o faturamento do caso D (3.717,41)', () => {
    expect(somar(c(71_100), c(158_827), c(74_078), c(62_236), c(5_500))).toBe(371_741);
  });

  it('soma vazia é zero', () => {
    expect(somar()).toBe(0);
  });

  it('calcula o lucro negativo do caso C (−4.800,00)', () => {
    expect(subtrair(c(3_500_000), c(3_980_000))).toBe(-480_000);
  });

  it('calcula o saldo final de banco do caso E (6.354,57)', () => {
    const entradas = somar(c(350_000), c(158_827), c(74_078), c(62_236));
    expect(subtrair(entradas, somar(c(1_906), c(7_778)))).toBe(635_457);
  });

  it('recusa estouro do inteiro seguro', () => {
    expect(() => somar(c(Number.MAX_SAFE_INTEGER), c(1))).toThrow(RangeError);
  });
});

describe('multiplicar', () => {
  it('calcula a previsão dos casos A (227.500,00) e D (92.935,25)', () => {
    expect(multiplicar(c(875_000), 26)).toBe(22_750_000);
    expect(multiplicar(c(371_741), 25)).toBe(9_293_525);
  });

  it('recusa fator não inteiro', () => {
    expect(() => multiplicar(c(100), 1.5)).toThrow(RangeError);
  });
});

describe('dividir', () => {
  it('calcula a média necessária do caso A (6.538,46)', () => {
    expect(dividir(c(17_000_000), 26)).toBe(653_846);
  });

  it('arredonda meio para cima a média do caso G (19.358,71)', () => {
    expect(dividir(c(3_871_741), 2)).toBe(1_935_871);
  });

  it('afasta do zero nos negativos', () => {
    expect(dividir(c(-5), 2)).toBe(-3);
  });

  it('devolve null na divisão por zero', () => {
    expect(dividir(c(100), 0)).toBeNull();
  });
});

describe('aplicarPercentual', () => {
  it('calcula as despesas de cartão do caso E', () => {
    expect(aplicarPercentual(c(158_827), percentual(120))).toBe(1_906);
    expect(aplicarPercentual(c(74_078), percentual(1_050))).toBe(7_778);
  });

  it('arredonda meio centavo para cima', () => {
    expect(aplicarPercentual(c(1), percentual(5_000))).toBe(1);
    expect(aplicarPercentual(c(5), percentual(1_000))).toBe(1);
    expect(aplicarPercentual(c(-1), percentual(5_000))).toBe(-1);
  });

  it('não perde precisão com valores altos', () => {
    expect(aplicarPercentual(c(9_000_000_000_000_000), percentual(10_000))).toBe(
      9_000_000_000_000_000,
    );
  });
});

describe('parseReais', () => {
  it.each([
    ['1.234,56', 123_456],
    ['1234,56', 123_456],
    ['R$ 8.750,00', 875_000],
    ['R$ 1.588,27', 158_827],
    ['  740,78 ', 74_078],
    ['0,5', 50],
    ['10', 1_000],
    ['1.234', 123_400],
    ['-300,00', -30_000],
    ['-R$ 4.800,00', -480_000],
    ['-0', 0],
  ])('lê %j', (texto, esperado) => {
    expect(parseReais(texto)).toBe(esperado);
  });

  it.each([
    '',
    'abc',
    'R$',
    '19,05924',
    '1,234.56',
    '1.5',
    '1.23,00',
    '12.3456,00',
    ',50',
    '--1',
    'R$ -10',
    '1e3',
    '99999999999999999999',
  ])('recusa %j', (texto) => {
    expect(parseReais(texto)).toBeNull();
  });
});

describe('formatarReais', () => {
  it('formata em pt-BR', () => {
    expect(formatarReais(c(123_456))).toBe('R$ 1.234,56');
    expect(formatarReais(c(5))).toBe('R$ 0,05');
    expect(formatarReais(c(0))).toBe('R$ 0,00');
    expect(formatarReais(c(22_750_000))).toBe('R$ 227.500,00');
    expect(formatarReais(c(-480_000))).toBe('-R$ 4.800,00');
  });

  it('formata sem símbolo', () => {
    expect(formatarReais(c(635_457), { simbolo: false })).toBe('6.354,57');
    expect(formatarReais(c(-117_943), { simbolo: false })).toBe('-1.179,43');
  });

  it('volta ao mesmo valor pelo parseReais', () => {
    for (const valor of [0, 1, 99, 100, 123_456, -480_000, Number.MAX_SAFE_INTEGER]) {
      expect(parseReais(formatarReais(c(valor)))).toBe(valor);
    }
  });
});
