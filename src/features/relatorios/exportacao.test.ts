import { describe, expect, it } from 'vitest';
import { CONTAS, FORMAS, r, saida } from '../../../tests/dominio/padrao';
import { celulaComoTexto } from '@/lib/exportar/tabela';
import { tabelaAnual, tabelaGerencial } from './exportacao';
import { gerencialDoMes, relatorioAnual, saidasPorConta } from './service';

describe('tabelaGerencial', () => {
  it('leva os números do caso C para a planilha exportada', () => {
    const gerencial = gerencialDoMes({
      contas: CONTAS,
      movimentacoes: [saida('2026-01-31', 'pro_labore', 5000), saida('2026-01-31', 'fgts', 10000)],
      despesasCartao: r(0),
      faturamento: r(35000),
    });
    const tabela = tabelaGerencial(gerencial, 'Loja', { ano: 2026, mes: 1 });
    expect(tabela.subtitulo).toContain('janeiro de 2026');
    const fixos = tabela.linhas.find((l) => celulaComoTexto(l.celulas[0]!) === 'Custos fixos');
    expect(fixos?.celulas.map(celulaComoTexto)).toEqual(['Custos fixos', '15.000,00', '42,86%']);
    const lucro = tabela.linhas.at(-1)!;
    expect(lucro.celulas.map(celulaComoTexto)).toEqual(['Lucro', '20.000,00', '57,14%']);
  });
});

describe('tabelaAnual', () => {
  it('tem 12 meses, total, média e percentual', () => {
    const anual = relatorioAnual({
      formas: FORMAS,
      contas: CONTAS,
      meses: [
        {
          faturamento: r(1000),
          entradasPorForma: { dinheiro: r(1000) },
          saidasPorConta: saidasPorConta(CONTAS, [saida('2026-01-10', 'aluguel', 300)], r(0)),
        },
      ],
    });
    const tabela = tabelaAnual(anual, 'Loja', 2026);
    expect(tabela.colunas).toHaveLength(16);
    expect(tabela.linhas.every((l) => l.celulas.length === 16)).toBe(true);
    expect(tabela.linhas.at(-1)!.celulas.map(celulaComoTexto).slice(-3)).toEqual([
      '700,00',
      '700,00',
      '70,00%',
    ]);
  });
});
