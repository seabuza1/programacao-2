import { describe, expect, it } from 'vitest';
import { centavos } from '@/lib/money';
import { percentual } from '@/lib/percent';
import { celulaComoTexto, nomeDeArquivo, pct, reais, texto } from './tabela';

describe('celulaComoTexto', () => {
  it('formata como na tela', () => {
    expect(celulaComoTexto(texto('Aluguel'))).toBe('Aluguel');
    expect(celulaComoTexto(reais(centavos(-480_000)))).toBe('-4.800,00');
    expect(celulaComoTexto(pct(percentual(-1371)))).toBe('-13,71%');
    expect(celulaComoTexto(pct(null))).toBe('—');
  });
});

describe('nomeDeArquivo', () => {
  it('tira acento e símbolo', () => {
    expect(nomeDeArquivo(['Gestão Fácil', 'Loja Exemplo (fictícia)', '2026-02'], 'pdf')).toBe(
      'gestao-facil-loja-exemplo-ficticia-2026-02.pdf',
    );
    expect(nomeDeArquivo(['***'], 'xlsx')).toBe('relatorio.xlsx');
  });
});
