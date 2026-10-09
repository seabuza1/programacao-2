/**
 * Único ponto da regra de arredondamento (docs/decisoes/0003-arredondamento.md):
 * meio para cima, afastando do zero nos negativos (2,5 → 3; −2,5 → −3).
 */
export function dividirArredondado(numerador: bigint, denominador: bigint): bigint {
  if (denominador === 0n) {
    throw new RangeError('Divisão por zero.');
  }
  const negativo = numerador < 0n !== denominador < 0n;
  const n = numerador < 0n ? -numerador : numerador;
  const d = denominador < 0n ? -denominador : denominador;
  const quociente = (2n * n + d) / (2n * d);
  return negativo ? -quociente : quociente;
}
