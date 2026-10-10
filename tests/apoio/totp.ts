import { createHmac } from 'node:crypto';

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decodificarBase32(texto: string): Buffer {
  let bits = '';
  for (const caractere of texto.replace(/=+$/, '').toUpperCase()) {
    const valor = ALFABETO_BASE32.indexOf(caractere);
    if (valor < 0) {
      throw new Error('Segredo TOTP inválido.');
    }
    bits += valor.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Código TOTP de 6 dígitos (RFC 6238, SHA-1, 30 s), como o app autenticador gera. */
export function codigoTotp(segredo: string, instante = Date.now()): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(instante / 30_000)));
  const hmac = createHmac('sha1', decodificarBase32(segredo)).update(contador).digest();
  const deslocamento = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const numero = (hmac.readUInt32BE(deslocamento) & 0x7fffffff) % 1_000_000;
  return String(numero).padStart(6, '0');
}
