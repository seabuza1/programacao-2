import { describe, expect, it } from 'vitest';
import { CONTAS, FORMAS, r, saida } from '../../../tests/dominio/padrao';
import { percentual } from '@/lib/percent';
import { analiseFaturamento, gerencialDoMes, proLaboreDoMes, relatorioAnual } from './service';

describe('gerencialDoMes', () => {
  it('sem faturamento, percentuais ficam vazios ("—"), sem erro', () => {
    const dre = gerencialDoMes({
      contas: CONTAS,
      movimentacoes: [saida('2026-03-01', 'aluguel', 100)],
      despesasCartao: r(0),
      faturamento: r(0),
    });
    expect(dre.lucro).toBe(r(-100));
    expect(dre.percentualLucro).toBeNull();
  });

  it('esconde conta desativada sem valor e mostra a desativada com valor', () => {
    const contas = CONTAS.map((c) =>
      c.id === 'aluguel' || c.id === 'marketing' ? { ...c, ativa: false } : c,
    );
    const dre = gerencialDoMes({
      contas,
      movimentacoes: [saida('2026-03-01', 'marketing', 10)],
      despesasCartao: r(0),
      faturamento: r(100),
    });
    const ids = dre.grupos.flatMap((g) => g.contas.map((c) => c.conta.id));
    expect(ids).not.toContain('aluguel');
    expect(ids).toContain('marketing');
  });
});

describe('proLaboreDoMes', () => {
  it('avisa acima de 20% do faturamento', () => {
    expect(proLaboreDoMes(r(2001), r(10000)).acimaDoLimite).toBe(true);
    expect(proLaboreDoMes(r(2000), r(10000)).acimaDoLimite).toBe(false);
    expect(proLaboreDoMes(r(100), r(0)).acimaDoLimite).toBe(true);
    expect(proLaboreDoMes(r(0), r(0)).acimaDoLimite).toBe(false);
  });
});

describe('relatorioAnual', () => {
  it('ano sem faturamento: médias e percentuais vazios', () => {
    const anual = relatorioAnual({ formas: FORMAS, contas: CONTAS, meses: [] });
    expect(anual.mesesLancados).toBe(0);
    expect(anual.faturamento.media).toBeNull();
    expect(anual.lucro.percentual).toBeNull();
    expect(anual.faturamento.meses).toHaveLength(12);
  });
});

describe('analiseFaturamento', () => {
  it('meta = ano anterior × (1 + crescimento); crescimento = realizado ÷ anterior − 1', () => {
    const anterior = [r(1000), r(2000), ...Array.from({ length: 10 }, () => r(0))];
    const realizado = [r(1200), r(1800), ...Array.from({ length: 10 }, () => r(0))];
    const analise = analiseFaturamento({
      anterior,
      realizado,
      crescimentoDesejado: percentual(1000),
    });
    expect(analise.meses[0]).toEqual({
      anterior: r(1000),
      meta: r(1100),
      realizado: r(1200),
      crescimento: percentual(2000),
    });
    expect(analise.meses[1]?.crescimento).toBe(percentual(-1000));
    expect(analise.meses[2]?.crescimento).toBeNull();
    expect(analise.total.realizado).toBe(r(3000));
    expect(analise.media.realizado).toBe(r(250));
  });
});
