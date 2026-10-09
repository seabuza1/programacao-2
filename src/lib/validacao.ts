import { z } from 'zod';
import { dataValida, parseMes } from './datas';
import { parseReais, type Centavos } from './money';
import { parsePercentual, type Percentual } from './percent';

// Mensagens padrão do Zod em português, para qualquer campo sem mensagem própria.
z.config(z.locales.ptBR());

function lerReais(texto: string, minimo: number, ctx: z.RefinementCtx): Centavos {
  const valor = parseReais(texto);
  if (valor === null) {
    ctx.addIssue({ code: 'custom', message: 'Valor inválido. Use o formato 1.234,56.' });
    return z.NEVER;
  }
  if (valor < minimo) {
    ctx.addIssue({ code: 'custom', message: 'O valor não pode ser negativo.' });
    return z.NEVER;
  }
  return valor;
}

/** Valor em reais digitado em pt-BR ("1.234,56") → centavos. Vazio vale zero. */
export function campoReais({ minimo = 0 } = {}) {
  return z
    .string()
    .transform((texto, ctx) => lerReais(texto.trim() === '' ? '0' : texto, minimo, ctx));
}

/** Como campoReais, mas vazio vira null. */
export function campoReaisOpcional({ minimo = 0 } = {}) {
  return z
    .string()
    .transform((texto, ctx) => (texto.trim() === '' ? null : lerReais(texto, minimo, ctx)));
}

/** Percentual digitado ("1,2" ou "1,2%") → centésimos de %. */
export function campoPercentual({ minimo = 0, maximo = 10_000 } = {}) {
  return z.string().transform((texto, ctx): Percentual => {
    const valor = parsePercentual(texto.trim() === '' ? '0' : texto);
    if (valor === null) {
      ctx.addIssue({ code: 'custom', message: 'Percentual inválido. Use o formato 1,2.' });
      return z.NEVER;
    }
    if (valor < minimo || valor > maximo) {
      ctx.addIssue({
        code: 'custom',
        message: `Use um valor entre ${minimo / 100}% e ${maximo / 100}%.`,
      });
      return z.NEVER;
    }
    return valor;
  });
}

export function campoInteiro({ minimo = 0, maximo = 1_000_000 } = {}) {
  return z
    .string()
    .trim()
    .transform((texto) => (texto === '' ? '0' : texto))
    .pipe(
      z.coerce
        .number<string>('Use um número inteiro.')
        .int('Use um número inteiro.')
        .min(minimo, `Use um número a partir de ${minimo}.`)
        .max(maximo, `Use um número até ${maximo}.`),
    );
}

/** 'AAAA-MM-DD' válida no calendário real. */
export const campoData = z.string().refine(dataValida, 'Data inválida.');

/** 'AAAA-MM' */
export const campoMes = z.string().transform((texto, ctx) => {
  const mes = parseMes(texto);
  if (!mes) {
    ctx.addIssue({ code: 'custom', message: 'Mês inválido.' });
    return z.NEVER;
  }
  return mes;
});

export const campoId = z.uuid('Registro inválido.');

export const campoTexto = (maximo: number, mensagem = 'Preencha este campo.') =>
  z.string().trim().min(1, mensagem).max(maximo, `Use no máximo ${maximo} caracteres.`);

/** Checkbox de formulário: presente = true. */
export const campoMarcado = z
  .union([z.literal('on'), z.literal('true'), z.null(), z.undefined()])
  .transform((valor) => valor === 'on' || valor === 'true');
