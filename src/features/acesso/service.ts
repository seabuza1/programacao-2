import type { Database } from '@/lib/database.types';

export type Papel = Database['public']['Enums']['papel'];

export const PAPEIS: readonly Papel[] = ['admin', 'dono', 'operador', 'leitor'];

export const NOME_DO_PAPEL: Record<Papel, string> = {
  admin: 'Administradora',
  dono: 'Dono',
  operador: 'Operador',
  leitor: 'Leitor',
};

/** admin, dono e operador lançam. leitor só lê. */
export function podeLancar(papel: Papel): boolean {
  return papel !== 'leitor';
}

/** admin e dono fazem tudo na empresa: cadastros, parâmetros, fechar e reabrir mês. */
export function podeGerenciar(papel: Papel): boolean {
  return papel === 'admin' || papel === 'dono';
}

export type NivelSessao = 'aal1' | 'aal2' | null;

export function exigeSegundoFator(precisaMfa: boolean, nivel: NivelSessao): boolean {
  return precisaMfa && nivel !== 'aal2';
}

/** Para onde mandar depois do login completo. */
export function rotaInicial(adminPlataforma: boolean): string {
  return adminPlataforma ? '/admin' : '/empresa';
}

const ROTAS_DE_RETORNO = ['/definir-senha'];

/** Só aceita retorno para rotas internas conhecidas (evita redirecionamento aberto). */
export function rotaDeRetornoSegura(valor: unknown): string | null {
  return typeof valor === 'string' && ROTAS_DE_RETORNO.includes(valor) ? valor : null;
}
