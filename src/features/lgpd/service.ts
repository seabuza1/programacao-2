/** Tabelas com dados de uma empresa, na ordem do arquivo de exportação. */
export const TABELAS_DA_EMPRESA = [
  'vinculos',
  'formas_recebimento',
  'plano_contas',
  'parametros_mes',
  'saldos_iniciais',
  'entradas_diarias',
  'indicadores_diarios',
  'movimentacoes',
  'meses_fechados',
  'parametros_markup',
  'produtos_preco',
  'faturamento_ano_anterior',
  'metas_anuais',
  'anotacoes',
  'auditoria',
] as const;

export type TabelaDaEmpresa = (typeof TABELAS_DA_EMPRESA)[number];

export interface PacoteDeDados {
  formato: 'gestao-facil/exportacao-completa';
  versao: 1;
  geradoEm: string;
  observacao: string;
  empresa: Record<string, unknown>;
  usuarios: Record<string, unknown>[];
  tabelas: Record<TabelaDaEmpresa, Record<string, unknown>[]>;
}

/** Arquivo de portabilidade (LGPD art. 18): todos os dados da empresa, em JSON. */
export function montarPacote(dados: {
  empresa: Record<string, unknown>;
  usuarios: Record<string, unknown>[];
  tabelas: Partial<Record<TabelaDaEmpresa, Record<string, unknown>[]>>;
  geradoEm: string;
}): PacoteDeDados {
  const tabelas = Object.fromEntries(
    TABELAS_DA_EMPRESA.map((nome) => [nome, dados.tabelas[nome] ?? []]),
  ) as Record<TabelaDaEmpresa, Record<string, unknown>[]>;
  return {
    formato: 'gestao-facil/exportacao-completa',
    versao: 1,
    geradoEm: dados.geradoEm,
    observacao:
      'Valores em centavos (inteiros) e percentuais em centésimos de % (1,2% = 120). Datas em UTC.',
    empresa: dados.empresa,
    usuarios: dados.usuarios,
    tabelas,
  };
}
