import { describe, expect, it } from 'vitest';
import { TABELAS_DA_EMPRESA, montarPacote } from './service';

describe('montarPacote', () => {
  it('traz todas as tabelas, mesmo vazias, com o formato e a data', () => {
    const pacote = montarPacote({
      empresa: { id: 'e', nome: 'Loja' },
      usuarios: [{ id: 'u', email: 'a@b.test' }],
      tabelas: { movimentacoes: [{ id: 'm', valor: 100 }] },
      geradoEm: '2026-10-09T12:00:00.000Z',
    });
    expect(pacote.formato).toBe('gestao-facil/exportacao-completa');
    expect(Object.keys(pacote.tabelas)).toEqual([...TABELAS_DA_EMPRESA]);
    expect(pacote.tabelas.movimentacoes).toEqual([{ id: 'm', valor: 100 }]);
    expect(pacote.tabelas.auditoria).toEqual([]);
    expect(pacote.geradoEm).toBe('2026-10-09T12:00:00.000Z');
  });
});
