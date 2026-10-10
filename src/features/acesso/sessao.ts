import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';
import { criarClienteServidor, type ClienteSupabase } from '@/lib/supabase/server';
import { opcoesCookieSessao } from '@/lib/supabase/cookies';
import {
  lerNivelSessao,
  lerPrecisaMfa,
  lerUsuarioAtual,
  listarEmpresasDoUsuario,
  temAcesso,
  type EmpresaDoUsuario,
  type UsuarioAtual,
} from './repository';
import { exigeSegundoFator, type Papel } from './service';

const COOKIE_EMPRESA_ATIVA = 'empresa_ativa';

export interface Contexto {
  supabase: ClienteSupabase;
  usuario: UsuarioAtual;
}

export interface ContextoEmpresa extends Contexto {
  empresa: EmpresaDoUsuario;
  empresas: EmpresaDoUsuario[];
  papel: Papel;
}

/** Usuário logado, sem exigir segundo fator. Só para as telas do próprio login. */
export const obterUsuarioParcial = cache(async (): Promise<Contexto | null> => {
  const supabase = await criarClienteServidor();
  const usuario = await lerUsuarioAtual(supabase);
  return usuario ? { supabase, usuario } : null;
});

/** Autentica: usuário logado e, se o papel pede, com segundo fator confirmado. */
export const exigirUsuario = cache(async (): Promise<Contexto> => {
  const contexto = await obterUsuarioParcial();
  if (!contexto) {
    redirect('/entrar');
  }
  const [precisaMfa, nivel] = await Promise.all([
    lerPrecisaMfa(contexto.supabase),
    lerNivelSessao(contexto.supabase),
  ]);
  if (exigeSegundoFator(precisaMfa, nivel)) {
    redirect('/entrar/segundo-fator');
  }
  return contexto;
});

/** Ações de plataforma (criar empresa, convidar, painel). Não dá acesso a dados. */
export const exigirAdminPlataforma = cache(async (): Promise<Contexto> => {
  const contexto = await exigirUsuario();
  if (!contexto.usuario.adminPlataforma) {
    redirect('/');
  }
  return contexto;
});

/**
 * Empresa ativa da sessão, conferida com tem_acesso a cada requisição.
 * Com um único vínculo, ele vale sem precisar escolher.
 */
export const exigirEmpresa = cache(async (): Promise<ContextoEmpresa> => {
  const contexto = await exigirUsuario();
  const empresas = await listarEmpresasDoUsuario(contexto.supabase, contexto.usuario.id);
  const escolhida = (await cookies()).get(COOKIE_EMPRESA_ATIVA)?.value;
  const empresa =
    empresas.find((e) => e.id === escolhida) ?? (empresas.length === 1 ? empresas[0] : undefined);
  if (!empresa || !(await temAcesso(contexto.supabase, empresa.id))) {
    redirect('/empresas');
  }
  return { ...contexto, empresa, empresas, papel: empresa.papel };
});

const esquemaEmpresaId = z.uuid();

/** Troca a empresa ativa, só se o usuário tiver vínculo com ela. */
export async function definirEmpresaAtiva(empresaId: unknown): Promise<boolean> {
  const { supabase } = await exigirUsuario();
  const id = esquemaEmpresaId.safeParse(empresaId);
  if (!id.success || !(await temAcesso(supabase, id.data))) {
    return false;
  }
  (await cookies()).set(COOKIE_EMPRESA_ATIVA, id.data, opcoesCookieSessao);
  return true;
}

export async function limparEmpresaAtiva(): Promise<void> {
  (await cookies()).delete(COOKIE_EMPRESA_ATIVA);
}
