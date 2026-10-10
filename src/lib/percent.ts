import { dividirArredondado } from './arredondamento';
import type { Centavos } from './money';

declare const marcaPercentual: unique symbol;

/** Percentual em centésimos de %: 1,2% = 120; 100% = 10000. */
export type Percentual = number & { readonly [marcaPercentual]: true };

export function percentual(valor: number): Percentual {
  if (!Number.isSafeInteger(valor)) {
    throw new RangeError('Percentual precisa ser inteiro em centésimos de %.');
  }
  return valor as Percentual;
}

export const CEM_POR_CENTO = percentual(10_000);

/** parte ÷ total em centésimos de %, arredondado. Total zero devolve null ("—" na tela). */
export function razao(parte: Centavos, total: Centavos): Percentual | null {
  if (total === 0) {
    return null;
  }
  return percentual(Number(dividirArredondado(BigInt(parte) * 10_000n, BigInt(total))));
}

const formatoPercentual = /^(-)?(\d+)(?:,(\d{1,2}))?%?$/;

/** Lê "1,2%", "10,5", "24 %". Mais de duas casas ou ponto decimal devolve null. */
export function parsePercentual(texto: string): Percentual | null {
  const partes = formatoPercentual.exec(texto.replace(/\s/g, ''));
  if (!partes) {
    return null;
  }
  const [, sinal, inteiro = '', decimal = ''] = partes;
  const absoluto = Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(absoluto)) {
    return null;
  }
  return percentual(sinal ? -absoluto : absoluto);
}

const formatoMilhar = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** "42,86%". null (divisão por zero) vira "—". */
export function formatarPercentual(valor: Percentual | null): string {
  if (valor === null) {
    return '—';
  }
  const absoluto = Math.abs(valor);
  const resto = absoluto % 100;
  const inteiro = formatoMilhar.format((absoluto - resto) / 100);
  const decimal = String(resto).padStart(2, '0');
  return `${valor < 0 ? '-' : ''}${inteiro},${decimal}%`;
}
