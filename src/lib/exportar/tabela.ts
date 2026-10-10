import { formatarReais, type Centavos } from '@/lib/money';
import { formatarPercentual, type Percentual } from '@/lib/percent';

/** Modelo neutro de tabela para exportar em Excel ou PDF. */
export type Celula =
  | { tipo: 'texto'; valor: string }
  | { tipo: 'reais'; valor: Centavos | null }
  | { tipo: 'percentual'; valor: Percentual | null };

export interface LinhaTabela {
  celulas: Celula[];
  destaque?: boolean;
}

export interface Tabela {
  titulo: string;
  subtitulo: string;
  colunas: string[];
  linhas: LinhaTabela[];
}

export const texto = (valor: string): Celula => ({ tipo: 'texto', valor });
export const reais = (valor: Centavos | null): Celula => ({ tipo: 'reais', valor });
export const pct = (valor: Percentual | null): Celula => ({ tipo: 'percentual', valor });

/** Texto da célula como aparece na tela (pt-BR; vazio vira "—"). */
export function celulaComoTexto(celula: Celula): string {
  if (celula.tipo === 'texto') {
    return celula.valor;
  }
  if (celula.valor === null) {
    return '—';
  }
  return celula.tipo === 'reais'
    ? formatarReais(celula.valor, { simbolo: false })
    : formatarPercentual(celula.valor);
}

/** Nome de arquivo só com letras simples, números e hífen. */
export function nomeDeArquivo(partes: string[], extensao: string): string {
  const base = partes
    .join('-')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'relatorio'}.${extensao}`;
}
