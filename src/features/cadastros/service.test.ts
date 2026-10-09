import { describe, expect, it } from 'vitest';
import {
  caixaDoDestino,
  diasPrevistosValidos,
  ordenarContas,
  podeRenomear,
  type Conta,
} from './service';

describe('caixaDoDestino', () => {
  it('dinheiro vai para o caixa; banco, Pix, boleto e cartões vão para o banco', () => {
    expect(caixaDoDestino('dinheiro')).toBe('dinheiro');
    expect(caixaDoDestino('banco')).toBe('banco');
    expect(caixaDoDestino('cartao_debito')).toBe('banco');
    expect(caixaDoDestino('cartao_credito')).toBe('banco');
  });

  it('crediário, brindes e permutas não alteram saldo', () => {
    expect(caixaDoDestino('nenhum')).toBeNull();
  });
});

describe('diasPrevistosValidos', () => {
  it('respeita o tamanho real do mês', () => {
    expect(diasPrevistosValidos(28, { ano: 2026, mes: 2 })).toBe(true);
    expect(diasPrevistosValidos(29, { ano: 2026, mes: 2 })).toBe(false);
    expect(diasPrevistosValidos(26, { ano: 2026, mes: 1 })).toBe(true);
    expect(diasPrevistosValidos(-1, { ano: 2026, mes: 1 })).toBe(false);
  });
});

describe('ordenarContas', () => {
  it('ordena por grupo, depois ordem e nome', () => {
    const conta = (grupo: Conta['grupo'], nome: string, ordem: number): Conta => ({
      id: nome,
      grupo,
      nome,
      ordem,
      padrao: false,
      ehProLabore: false,
      ehDespesaFinanceira: false,
      ativa: true,
    });
    const ordenadas = ordenarContas([
      conta('investimento', 'Reformas', 30),
      conta('variavel', 'Impostos', 20),
      conta('fixo', 'Outros', 150),
      conta('fixo', 'Aluguel', 10),
    ]);
    expect(ordenadas.map((c) => c.nome)).toEqual(['Aluguel', 'Outros', 'Impostos', 'Reformas']);
  });
});

describe('podeRenomear', () => {
  it('item padrão não é renomeado', () => {
    expect(podeRenomear({ padrao: true })).toBe(false);
    expect(podeRenomear({ padrao: false })).toBe(true);
  });
});
