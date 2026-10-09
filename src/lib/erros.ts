import type { z } from 'zod';

/** Resultado de uma ação de formulário. Nunca carrega dado sensível nem detalhe interno. */
export type Resultado =
  | { ok: true; mensagem?: string }
  | {
      ok: false;
      erro: string;
      campos?: Record<string, string>;
      /** O que foi digitado, para o formulário não perder (nunca senha). */
      valores?: Record<string, string>;
    };

export const INICIAL: Resultado = { ok: true };

export function falha(
  erro: string,
  campos?: Record<string, string>,
  valores?: Record<string, string>,
): Resultado {
  return {
    ok: false,
    erro,
    ...(campos ? { campos } : {}),
    ...(valores ? { valores } : {}),
  };
}

/** Campos de texto enviados, para devolver ao formulário em caso de erro. */
export function ecoar(formData: FormData, nomes: string[]): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const nome of nomes) {
    const valor = formData.get(nome);
    if (typeof valor === 'string') {
      valores[nome] = valor.slice(0, 500);
    }
  }
  return valores;
}

/** Erros por campo e valores digitados de um resultado, prontos para o formulário. */
export function estadoDoFormulario(resultado: Resultado) {
  return resultado.ok
    ? { campos: {} as Record<string, string>, valores: {} as Record<string, string> }
    : { campos: resultado.campos ?? {}, valores: resultado.valores ?? {} };
}

export function sucesso(mensagem?: string): Resultado {
  return mensagem ? { ok: true, mensagem } : { ok: true };
}

/** Primeiro erro de cada campo, para mostrar ao lado do campo. */
export function falhaDeValidacao(erro: z.ZodError, valores?: Record<string, string>): Resultado {
  const campos: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = issue.path.join('.') || '_';
    campos[campo] ??= issue.message;
  }
  return falha('Confira os campos destacados.', campos, valores);
}

/** Erro de regra de negócio com mensagem pronta para a tela. */
export class ErroDeNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeNegocio';
  }
}

interface ErroDoBanco {
  code?: string;
  message?: string;
}

const MENSAGENS_DO_BANCO: Record<string, string> = {
  '42501': 'Você não tem permissão para esta ação.',
  '23505': 'Já existe um registro igual.',
  P0002: 'Registro não encontrado.',
};

/** Traduz erro do Postgres/PostgREST para mensagem da tela, sem vazar detalhes. */
export function mensagemDoBanco(erro: ErroDoBanco): string {
  if (erro.code === 'P0001' && erro.message) {
    // Exceções levantadas pelas nossas funções já vêm em pt-BR para a tela.
    return erro.message;
  }
  return (
    (erro.code && MENSAGENS_DO_BANCO[erro.code]) ?? 'Não foi possível concluir. Tente de novo.'
  );
}
