import { describe, expect, it } from 'vitest';
import { CONTAS, FORMAS, entrada, r } from '../../../tests/dominio/padrao';
import { percentual } from '@/lib/percent';
import {
  descreverMovimentacao,
  efeitoDaMovimentacao,
  efeitoNosSaldos,
  livroDoMes,
  saldoInicialDoMes,
  type Movimentacao,
  type TaxasPorMes,
} from './service';

const mov = (parcial: Partial<Movimentacao>): Movimentacao => ({
  id: 'm',
  data: '2026-03-10',
  descricao: '',
  tipo: 'saida',
  caixa: 'banco',
  valor: r(100),
  contaId: 'aluguel',
  origem: null,
  ...parcial,
});

describe('efeitoDaMovimentacao', () => {
  it('saída tira do caixa informado', () => {
    expect(efeitoDaMovimentacao(mov({ caixa: 'dinheiro' }))).toEqual({
      dinheiro: r(-100),
      banco: r(0),
    });
  });

  it('entrada soma no caixa informado', () => {
    expect(efeitoDaMovimentacao(mov({ tipo: 'entrada', contaId: null, origem: 'outro' }))).toEqual({
      dinheiro: r(0),
      banco: r(100),
    });
  });

  it('transferência sai de um caixa e entra no outro', () => {
    expect(
      efeitoDaMovimentacao(mov({ tipo: 'transferencia', caixa: 'dinheiro', contaId: null })),
    ).toEqual({ dinheiro: r(-100), banco: r(100) });
  });
});

describe('efeitoNosSaldos', () => {
  it('usa a taxa do mês de cada entrada', () => {
    const taxas: TaxasPorMes = {
      '2026-03': { taxaDebito: percentual(100), taxaCredito: percentual(0) },
      '2026-04': { taxaDebito: percentual(200), taxaCredito: percentual(0) },
    };
    const saldos = efeitoNosSaldos({
      formas: FORMAS,
      entradas: [entrada('2026-03-10', 'debito', 100), entrada('2026-04-10', 'debito', 100)],
      movimentacoes: [],
      taxas,
    });
    expect(saldos.banco).toBe(r(200 - 1 - 2));
  });

  it('crediário, brindes e permutas não alteram saldo', () => {
    const saldos = efeitoNosSaldos({
      formas: FORMAS,
      entradas: ['crediario', 'brindes', 'permutas'].map((f) => entrada('2026-03-10', f, 50)),
      movimentacoes: [],
      taxas: {},
    });
    expect(saldos).toEqual({ dinheiro: r(0), banco: r(0) });
  });
});

describe('saldoInicialDoMes', () => {
  const lancamentos = {
    formas: FORMAS,
    entradas: [entrada('2026-01-10', 'dinheiro', 100), entrada('2026-02-10', 'pix', 40)],
    movimentacoes: [],
    taxas: {},
  };

  it('antes do mês de início não há saldo', () => {
    const iniciais = { mesInicio: { ano: 2026, mes: 2 }, dinheiro: r(10), banco: r(20) };
    expect(saldoInicialDoMes({ ano: 2026, mes: 1 }, iniciais, lancamentos)).toBeNull();
  });

  it('lançamentos anteriores ao início não contam', () => {
    const iniciais = { mesInicio: { ano: 2026, mes: 2 }, dinheiro: r(10), banco: r(20) };
    expect(saldoInicialDoMes({ ano: 2026, mes: 3 }, iniciais, lancamentos)).toEqual({
      dinheiro: r(10),
      banco: r(60),
    });
  });

  it('sem saldos iniciais, começa em zero', () => {
    expect(saldoInicialDoMes({ ano: 2026, mes: 3 }, null, lancamentos)).toEqual({
      dinheiro: r(100),
      banco: r(40),
    });
  });
});

describe('livroDoMes', () => {
  it('mostra saldo corrente e marca só movimentações como editáveis', () => {
    const livro = livroDoMes({
      mes: { ano: 2026, mes: 3 },
      saldoInicial: { dinheiro: r(0), banco: r(0) },
      formas: FORMAS,
      contas: CONTAS,
      entradas: [entrada('2026-03-10', 'dinheiro', 500)],
      movimentacoes: [
        mov({
          id: 'deposito',
          tipo: 'transferencia',
          caixa: 'dinheiro',
          contaId: null,
          valor: r(300),
        }),
      ],
      taxas: {},
    });
    expect(
      livro.linhas.map((l) => [l.tipo, l.saldoDinheiro, l.saldoBanco, l.movimentacaoId]),
    ).toEqual([
      ['entrada_automatica', r(500), r(0), null],
      ['movimentacao', r(200), r(300), 'deposito'],
    ]);
  });
});

describe('descreverMovimentacao', () => {
  it('usa o nome da conta e a descrição', () => {
    const contas = new Map(CONTAS.map((c) => [c.id, c]));
    expect(descreverMovimentacao(mov({ descricao: 'março' }), contas)).toBe('Aluguel · março');
    expect(
      descreverMovimentacao(
        mov({ tipo: 'transferencia', caixa: 'dinheiro', contaId: null }),
        contas,
      ),
    ).toBe('Transferência Dinheiro → Banco');
  });
});
