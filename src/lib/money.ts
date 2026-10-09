import { dividirArredondado } from './arredondamento';
import type { Percentual } from './percent';

declare const marcaCentavos: unique symbol;

/** Dinheiro em centavos inteiros. Nunca float. */
export type Centavos = number & { readonly [marcaCentavos]: true };

export function centavos(valor: number): Centavos {
  if (!Number.isSafeInteger(valor)) {
    throw new RangeError('Valor em centavos precisa ser inteiro.');
  }
  return valor as Centavos;
}

export const ZERO = centavos(0);

function deBigInt(valor: bigint): Centavos {
  return centavos(Number(valor));
}

export function somar(...valores: Centavos[]): Centavos {
  return deBigInt(valores.reduce((total, valor) => total + BigInt(valor), 0n));
}

export function subtrair(a: Centavos, b: Centavos): Centavos {
  return deBigInt(BigInt(a) - BigInt(b));
}

export function multiplicar(valor: Centavos, fator: number): Centavos {
  if (!Number.isSafeInteger(fator)) {
    throw new RangeError('Fator precisa ser inteiro.');
  }
  return deBigInt(BigInt(valor) * BigInt(fator));
}

/** Divide por um inteiro, arredondando ao centavo. Divisor zero devolve null. */
export function dividir(valor: Centavos, divisor: number): Centavos | null {
  if (!Number.isSafeInteger(divisor)) {
    throw new RangeError('Divisor precisa ser inteiro.');
  }
  if (divisor === 0) {
    return null;
  }
  return deBigInt(dividirArredondado(BigInt(valor), BigInt(divisor)));
}

/** valor × percentual, arredondado ao centavo. Ex.: 1.588,27 × 1,2% = 19,06. */
export function aplicarPercentual(valor: Centavos, percentual: Percentual): Centavos {
  return deBigInt(dividirArredondado(BigInt(valor) * BigInt(percentual), 10_000n));
}

/** valor ÷ percentual, arredondado ao centavo. Ex.: 5,00 ÷ 66,5% = 7,52. Zero devolve null. */
export function dividirPorPercentual(valor: Centavos, percentual: Percentual): Centavos | null {
  if (percentual === 0) {
    return null;
  }
  return deBigInt(dividirArredondado(BigInt(valor) * 10_000n, BigInt(percentual)));
}

const formatoReais = /^(-)?(?:R\$)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/**
 * Lê valor digitado em pt-BR: "1.234,56", "1234,56", "R$ 10", "-300,00".
 * Mais de duas casas decimais ou formato ambíguo ("1.5") devolve null.
 */
export function parseReais(texto: string): Centavos | null {
  const partes = formatoReais.exec(texto.replace(/\s/g, ''));
  if (!partes) {
    return null;
  }
  const [, sinal, inteiro = '', decimal = ''] = partes;
  const absoluto = BigInt(inteiro.replaceAll('.', '')) * 100n + BigInt(decimal.padEnd(2, '0'));
  const valor = sinal ? -absoluto : absoluto;
  return Number.isSafeInteger(Number(valor)) ? deBigInt(valor) : null;
}

const formatoMilhar = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** "R$ 1.234,56" (espaço não separável) ou, sem símbolo, "1.234,56". */
export function formatarReais(valor: Centavos, { simbolo = true } = {}): string {
  const absoluto = valor < 0 ? -BigInt(valor) : BigInt(valor);
  const inteiro = formatoMilhar.format(absoluto / 100n);
  const decimal = String(absoluto % 100n).padStart(2, '0');
  const sinal = valor < 0 ? '-' : '';
  return `${sinal}${simbolo ? 'R$\u00a0' : ''}${inteiro},${decimal}`;
}
