import type { Forma, ParametrosMes } from '@/features/cadastros';
import { dividirArredondado } from '@/lib/arredondamento';
import { datasDoMes, mesDe, type Mes } from '@/lib/datas';
import { centavos, dividir, somar, ZERO, type Centavos } from '@/lib/money';
import { razao, type Percentual } from '@/lib/percent';

export interface Entrada {
  data: string;
  formaId: string;
  valor: Centavos;
}

export interface Indicador {
  data: string;
  qtdVendas: number;
  qtdProdutos: number;
  descontos: Centavos;
}

export interface DiaDoCaixa {
  data: string;
  valores: Record<string, Centavos>;
  total: Centavos;
  indicador: Indicador | null;
}

export interface ResumoCaixaDiario {
  dias: DiaDoCaixa[];
  totalPorForma: Record<string, Centavos>;
  totalGeral: Centavos;
  faturamento: Centavos;
  participacao: Record<string, Percentual | null>;
  diasLancados: number;
  mediaNecessaria: Centavos | null;
  mediaRealizada: Centavos | null;
  previsao: Centavos | null;
  previsaoAbaixoDaMeta: boolean;
  qtdVendas: number;
  qtdProdutos: number;
  descontos: Centavos;
  ticketMedio: Centavos | null;
}

function doMes(mes: Mes) {
  return (item: { data: string }) => {
    const { ano, mes: m } = mesDe(item.data);
    return ano === mes.ano && m === mes.mes;
  };
}

/** Soma, no período, das formas que contam no faturamento. */
export function faturamento(formas: Forma[], entradas: Entrada[]): Centavos {
  const contam = new Set(formas.filter((f) => f.contaFaturamento).map((f) => f.id));
  return somar(...entradas.filter((e) => contam.has(e.formaId)).map((e) => e.valor));
}

export function resumirCaixaDiario(dados: {
  mes: Mes;
  formas: Forma[];
  entradas: Entrada[];
  indicadores: Indicador[];
  parametros: ParametrosMes;
}): ResumoCaixaDiario {
  const { mes, formas, parametros } = dados;
  const entradas = dados.entradas.filter(doMes(mes));
  const indicadores = dados.indicadores.filter(doMes(mes));

  const dias = datasDoMes(mes).map((data): DiaDoCaixa => {
    const doDia = entradas.filter((e) => e.data === data);
    const valores: Record<string, Centavos> = {};
    for (const entrada of doDia) {
      valores[entrada.formaId] = somar(valores[entrada.formaId] ?? ZERO, entrada.valor);
    }
    return {
      data,
      valores,
      total: somar(...doDia.map((e) => e.valor)),
      indicador: indicadores.find((i) => i.data === data) ?? null,
    };
  });

  const totalPorForma: Record<string, Centavos> = {};
  for (const forma of formas) {
    totalPorForma[forma.id] = somar(
      ...entradas.filter((e) => e.formaId === forma.id).map((e) => e.valor),
    );
  }
  const fat = faturamento(formas, entradas);
  const participacao: Record<string, Percentual | null> = {};
  for (const forma of formas) {
    participacao[forma.id] = razao(totalPorForma[forma.id] ?? ZERO, fat);
  }

  // Dias com alguma entrada maior que zero (decisão D4: calculado, não digitado).
  const diasLancados = dias.filter((dia) => dia.total > 0).length;
  const mediaNecessaria = dividir(parametros.meta, parametros.diasPrevistos);
  const mediaRealizada = dividir(fat, diasLancados);
  // media_realizada × dias_previstos, arredondando uma vez só.
  const previsao =
    diasLancados === 0 || parametros.diasPrevistos === 0
      ? null
      : centavos(
          Number(
            dividirArredondado(
              BigInt(fat) * BigInt(parametros.diasPrevistos),
              BigInt(diasLancados),
            ),
          ),
        );

  const qtdVendas = indicadores.reduce((total, i) => total + i.qtdVendas, 0);
  return {
    dias,
    totalPorForma,
    totalGeral: somar(...entradas.map((e) => e.valor)),
    faturamento: fat,
    participacao,
    diasLancados,
    mediaNecessaria,
    mediaRealizada,
    previsao,
    previsaoAbaixoDaMeta: previsao !== null && parametros.meta > 0 && previsao < parametros.meta,
    qtdVendas,
    qtdProdutos: indicadores.reduce((total, i) => total + i.qtdProdutos, 0),
    descontos: somar(...indicadores.map((i) => i.descontos)),
    ticketMedio: dividir(fat, qtdVendas),
  };
}
