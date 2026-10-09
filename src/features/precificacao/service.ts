import { dividirPorPercentual, somar, type Centavos } from '@/lib/money';
import { percentual, type Percentual } from '@/lib/percent';

export interface ParametrosMarkup {
  taxaCartao: Percentual;
  despesaFixa: Percentual;
  imposto: Percentual;
  comissao: Percentual;
  investimentos: Percentual;
  margemLucro: Percentual;
}

export const ROTULOS_MARKUP: Record<keyof ParametrosMarkup, string> = {
  taxaCartao: 'Taxa de cartão',
  despesaFixa: 'Despesa fixa',
  imposto: 'Imposto',
  comissao: 'Comissão',
  investimentos: 'Investimentos',
  margemLucro: 'Margem de lucro',
};

export type ResultadoMarkup =
  { ok: true; soma: Percentual; markup: Percentual } | { ok: false; erro: string };

/** markup = 1 − soma dos percentuais. Cada um entre 0 e 100%, soma menor que 100%. */
export function calcularMarkup(p: ParametrosMarkup): ResultadoMarkup {
  const valores = Object.values(p) as Percentual[];
  if (valores.some((v) => v < 0 || v > 10_000)) {
    return { ok: false, erro: 'Cada percentual precisa estar entre 0% e 100%.' };
  }
  const soma = valores.reduce((total, v) => total + v, 0);
  if (soma >= 10_000) {
    return { ok: false, erro: 'A soma dos percentuais precisa ser menor que 100%.' };
  }
  return { ok: true, soma: percentual(soma), markup: percentual(10_000 - soma) };
}

export interface ProdutoPreco {
  id: string;
  nome: string;
  custo: Centavos;
  frete: Centavos;
  embalagem: Centavos;
  impostoEntrada: Centavos;
  precoTrabalhado: Centavos | null;
  precoConcorrente: Centavos | null;
}

export function custoTotal(
  p: Pick<ProdutoPreco, 'custo' | 'frete' | 'embalagem' | 'impostoEntrada'>,
) {
  return somar(p.custo, p.frete, p.embalagem, p.impostoEntrada);
}

/** custo_total ÷ markup, arredondado ao centavo. Sem markup válido, não há preço. */
export function precoSugerido(custo: Centavos, resultado: ResultadoMarkup): Centavos | null {
  return resultado.ok ? dividirPorPercentual(custo, resultado.markup) : null;
}

/** 6650 → "0,665" */
export function formatarFator(markup: Percentual): string {
  const resto = markup % 10_000;
  const inteiro = (markup - resto) / 10_000;
  const decimais = String(resto).padStart(4, '0').replace(/0+$/, '');
  return decimais ? `${inteiro},${decimais}` : String(inteiro);
}

export type Setor = 'servicos' | 'comercio' | 'industria';

export const NOME_DO_SETOR: Record<Setor, string> = {
  servicos: 'Serviços',
  comercio: 'Comércio',
  industria: 'Indústria',
};

/** Faixas de margem sugeridas pela planilha. */
export const FAIXAS_DE_MARGEM: Record<Setor, { minimo: Percentual; maximo: Percentual }> = {
  servicos: { minimo: percentual(2_000), maximo: percentual(3_000) },
  comercio: { minimo: percentual(1_500), maximo: percentual(2_000) },
  industria: { minimo: percentual(800), maximo: percentual(1_200) },
};

export function margemForaDaFaixa(margem: Percentual, setor: Setor): boolean {
  const { minimo, maximo } = FAIXAS_DE_MARGEM[setor];
  return margem < minimo || margem > maximo;
}
