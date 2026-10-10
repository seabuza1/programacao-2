import { describe, expect, it } from 'vitest';
import { centavos } from '@/lib/money';
import { percentual } from '@/lib/percent';
import { calcularMarkup, custoTotal, formatarFator, margemForaDaFaixa } from './service';

const p = percentual;
const zero = {
  taxaCartao: p(0),
  despesaFixa: p(0),
  imposto: p(0),
  comissao: p(0),
  investimentos: p(0),
  margemLucro: p(0),
};

describe('calcularMarkup', () => {
  it('recusa percentual fora de 0 a 100%', () => {
    expect(calcularMarkup({ ...zero, imposto: p(10_001) }).ok).toBe(false);
    expect(calcularMarkup({ ...zero, imposto: p(-1) }).ok).toBe(false);
  });

  it('recusa soma igual a 100%', () => {
    expect(calcularMarkup({ ...zero, despesaFixa: p(5_000), margemLucro: p(5_000) })).toEqual({
      ok: false,
      erro: 'A soma dos percentuais precisa ser menor que 100%.',
    });
  });

  it('tudo zero dá markup 1', () => {
    expect(calcularMarkup(zero)).toEqual({ ok: true, soma: p(0), markup: p(10_000) });
  });
});

describe('custoTotal', () => {
  it('soma custo, frete, embalagem e imposto de entrada', () => {
    expect(
      custoTotal({
        custo: centavos(1000),
        frete: centavos(150),
        embalagem: centavos(50),
        impostoEntrada: centavos(80),
      }),
    ).toBe(1280);
  });
});

describe('formatarFator', () => {
  it('mostra o markup como fator', () => {
    expect(formatarFator(p(6_650))).toBe('0,665');
    expect(formatarFator(p(9_000))).toBe('0,9');
    expect(formatarFator(p(10_000))).toBe('1');
    expect(formatarFator(p(1))).toBe('0,0001');
  });
});

describe('margemForaDaFaixa', () => {
  it('usa as faixas da planilha', () => {
    expect(margemForaDaFaixa(p(2_500), 'servicos')).toBe(false);
    expect(margemForaDaFaixa(p(950), 'comercio')).toBe(true);
    expect(margemForaDaFaixa(p(1_000), 'industria')).toBe(false);
    expect(margemForaDaFaixa(p(1_300), 'industria')).toBe(true);
  });
});
