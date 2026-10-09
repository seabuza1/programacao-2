import 'server-only';
import writeXlsxFile, { type Cell, type Row } from 'write-excel-file/node';
import type { Celula, Tabela } from './tabela';

function celula(c: Celula, destaque: boolean): Cell {
  const peso = destaque ? ({ fontWeight: 'bold' } as const) : {};
  if (c.tipo === 'texto') {
    return { value: c.valor, type: String, ...peso };
  }
  if (c.valor === null) {
    return { value: '—', type: String, align: 'right', ...peso };
  }
  // Números do Excel: reais e fração (a conta continua em inteiros no sistema).
  return c.tipo === 'reais'
    ? { value: c.valor / 100, type: Number, format: '#,##0.00', ...peso }
    : { value: c.valor / 10_000, type: Number, format: '0.00%', ...peso };
}

export async function gerarXlsx(tabela: Tabela): Promise<Buffer> {
  const dados: Row[] = [
    [{ value: tabela.titulo, type: String, fontWeight: 'bold' }],
    [{ value: tabela.subtitulo, type: String }],
    [],
    tabela.colunas.map((nome) => ({ value: nome, type: String, fontWeight: 'bold' as const })),
    ...tabela.linhas.map((linha) => linha.celulas.map((c) => celula(c, !!linha.destaque))),
  ];
  const larguras = tabela.colunas.map((_, i) => ({ width: i === 0 ? 42 : 14 }));
  return writeXlsxFile(dados, { sheet: 'Relatório', columns: larguras }).toBuffer();
}
