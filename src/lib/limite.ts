import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { criarClienteAdmin } from '@/lib/supabase/admin';

/** Limites por ação: tentativas por janela (segundos). */
export const LIMITES = {
  loginPorEmail: { maximo: 5, janela: 15 * 60 },
  loginPorIp: { maximo: 30, janela: 15 * 60 },
  codigoPorUsuario: { maximo: 6, janela: 5 * 60 },
  senhaPorEmail: { maximo: 3, janela: 60 * 60 },
  senhaPorIp: { maximo: 10, janela: 60 * 60 },
  convitePorUsuario: { maximo: 30, janela: 60 * 60 },
  exportacaoPorUsuario: { maximo: 30, janela: 10 * 60 },
  errosDoNavegador: { maximo: 20, janela: 10 * 60 },
} as const;

export type Limite = keyof typeof LIMITES;

/** Hash curto: a chave nunca guarda e-mail, IP ou id em claro. */
function resumo(valor: string): string {
  return createHash('sha256').update(valor.trim().toLowerCase()).digest('base64url').slice(0, 32);
}

/** IP do cliente informado pela Vercel (primeiro valor de x-forwarded-for). */
export async function ipDoCliente(): Promise<string> {
  const lista = (await headers()).get('x-forwarded-for') ?? '';
  return lista.split(',')[0]?.trim() || 'desconhecido';
}

/**
 * Consome uma tentativa. Devolve false quando o limite estourou.
 * Se o banco falhar, deixa passar: o Supabase Auth tem limites próprios como segunda barreira.
 */
export async function dentroDoLimite(limite: Limite, identificador: string): Promise<boolean> {
  const { maximo, janela } = LIMITES[limite];
  const { data, error } = await criarClienteAdmin().rpc('consumir_limite', {
    p_chave: `${limite}:${resumo(identificador)}`,
    p_maximo: maximo,
    p_janela_segundos: janela,
  });
  return error ? true : data === true;
}

export const MENSAGEM_LIMITE = 'Muitas tentativas. Espere alguns minutos e tente de novo.';
