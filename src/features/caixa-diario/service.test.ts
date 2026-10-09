import { describe, expect, it } from 'vitest';
import { FORMAS, entrada, r } from '../../../tests/dominio/padrao';
import type { ParametrosMes } from '@/features/cadastros';
import { percentual } from '@/lib/percent';
import { faturamento, resumirCaixaDiario } from './service';

const MES = { ano: 2026, mes: 3 };
const parametros = (diasPrevistos: number, meta: number): ParametrosMes => ({
  diasPrevistos,
  meta: r(meta),
  taxaDebito: percentual(0),
  taxaCredito: percentual(0),
});

describe('resumirCaixaDiario', () => {
  it('mês sem lançamento: zeros e médias vazias, sem erro', () => {
    const resumo = resumirCaixaDiario({
      mes: MES,
      formas: FORMAS,
      entradas: [],
      indicadores: [],
      parametros: parametros(0, 0),
    });
    expect(resumo.dias).toHaveLength(31);
    expect(resumo.faturamento).toBe(0);
    expect(resumo.diasLancados).toBe(0);
    expect(resumo.mediaNecessaria).toBeNull();
    expect(resumo.mediaRealizada).toBeNull();
    expect(resumo.previsao).toBeNull();
    expect(resumo.ticketMedio).toBeNull();
    expect(resumo.participacao.dinheiro).toBeNull();
  });

  it('ignora lançamentos de outro mês', () => {
    const resumo = resumirCaixaDiario({
      mes: MES,
      formas: FORMAS,
      entradas: [entrada('2026-02-28', 'dinheiro', 100), entrada('2026-03-01', 'dinheiro', 50)],
      indicadores: [],
      parametros: parametros(26, 0),
    });
    expect(resumo.faturamento).toBe(r(50));
  });

  it('forma que não conta no faturamento entra no total do dia, mas não no faturamento', () => {
    const formas = FORMAS.map((f) => (f.id === 'brindes' ? { ...f, contaFaturamento: false } : f));
    const entradas = [entrada('2026-03-02', 'dinheiro', 100), entrada('2026-03-02', 'brindes', 30)];
    expect(faturamento(formas, entradas)).toBe(r(100));
    const resumo = resumirCaixaDiario({
      mes: MES,
      formas,
      entradas,
      indicadores: [],
      parametros: parametros(26, 0),
    });
    expect(resumo.dias[1]?.total).toBe(r(130));
    expect(resumo.totalGeral).toBe(r(130));
  });

  it('calcula ticket médio pelos indicadores do mês', () => {
    const resumo = resumirCaixaDiario({
      mes: MES,
      formas: FORMAS,
      entradas: [entrada('2026-03-02', 'dinheiro', 1000)],
      indicadores: [
        { data: '2026-03-02', qtdVendas: 3, qtdProdutos: 7, descontos: r(10) },
        { data: '2026-03-03', qtdVendas: 1, qtdProdutos: 1, descontos: r(0) },
      ],
      parametros: parametros(26, 0),
    });
    expect(resumo.qtdVendas).toBe(4);
    expect(resumo.qtdProdutos).toBe(8);
    expect(resumo.descontos).toBe(r(10));
    expect(resumo.ticketMedio).toBe(r(250));
  });

  it('avisa previsão abaixo da meta', () => {
    const resumo = resumirCaixaDiario({
      mes: MES,
      formas: FORMAS,
      entradas: [entrada('2026-03-02', 'dinheiro', 1000)],
      indicadores: [],
      parametros: parametros(20, 30000),
    });
    expect(resumo.previsao).toBe(r(20000));
    expect(resumo.previsaoAbaixoDaMeta).toBe(true);
  });

  it('arredonda a previsão uma vez só', () => {
    // 100,00 em 3 dias, 26 previstos: 100 × 26 ÷ 3 = 866,666… → 866,67.
    const resumo = resumirCaixaDiario({
      mes: MES,
      formas: FORMAS,
      entradas: [
        entrada('2026-03-02', 'dinheiro', 33.33),
        entrada('2026-03-03', 'dinheiro', 33.33),
        entrada('2026-03-04', 'dinheiro', 33.34),
      ],
      indicadores: [],
      parametros: parametros(26, 0),
    });
    expect(resumo.previsao).toBe(r(866.67));
  });
});
