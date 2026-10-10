import type { Metadata } from 'next';
import { mesDaUrl } from '@/app/_componentes/mes';
import { exigirEmpresa, podeLancar } from '@/features/acesso';
import {
  GradeCaixaDiario,
  IndicadoresDoMes,
  ParticipacaoPorForma,
  listarEntradas,
  listarIndicadores,
  resumirCaixaDiario,
  type LinhaGrade,
} from '@/features/caixa-diario';
import { listarFormas, listarParametros, parametrosVazios } from '@/features/cadastros';
import { AvisoMesFechado, listarMesesFechados } from '@/features/fechamento';
import { chaveDoMes, diaDaSemana, primeiroDia, ultimoDia } from '@/lib/datas';
import { formatarReais, ZERO, type Centavos } from '@/lib/money';
import { SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Caixa diário' };

interface Props {
  searchParams: Promise<{ mes?: string | string[] }>;
}

const reais = (valor: Centavos) => (valor === 0 ? '' : formatarReais(valor, { simbolo: false }));

export default async function CaixaDiario({ searchParams }: Props) {
  const { supabase, empresa, papel } = await exigirEmpresa();
  const mes = mesDaUrl((await searchParams).mes);
  const [de, ate] = [primeiroDia(mes), ultimoDia(mes)];
  const [todasAsFormas, parametros, entradas, indicadores, fechados] = await Promise.all([
    listarFormas(supabase, empresa.id),
    listarParametros(supabase, empresa.id),
    listarEntradas(supabase, empresa.id, de, ate),
    listarIndicadores(supabase, empresa.id, de, ate),
    listarMesesFechados(supabase, empresa.id),
  ]);
  const doMes = parametros[chaveDoMes(mes)] ?? parametrosVazios();
  const resumo = resumirCaixaDiario({
    mes,
    formas: todasAsFormas,
    entradas,
    indicadores,
    parametros: doMes,
  });
  // Formas desativadas só aparecem se tiverem lançamento no mês.
  const formas = todasAsFormas.filter((f) => f.ativa || (resumo.totalPorForma[f.id] ?? ZERO) > 0);
  const fechado = fechados.has(chaveDoMes(mes));
  const linhas: LinhaGrade[] = resumo.dias.map((dia) => ({
    data: dia.data,
    rotulo: `${dia.data.slice(8, 10)} ${diaDaSemana(dia.data)}`,
    valores: Object.fromEntries(Object.entries(dia.valores).map(([id, v]) => [id, reais(v)])),
    total: reais(dia.total),
    indicador: {
      qtdVendas: dia.indicador?.qtdVendas ? String(dia.indicador.qtdVendas) : '',
      qtdProdutos: dia.indicador?.qtdProdutos ? String(dia.indicador.qtdProdutos) : '',
      descontos: dia.indicador ? reais(dia.indicador.descontos) : '',
    },
  }));

  return (
    <div className="pilha">
      <div className="linha">
        <h1 style={{ margin: 0 }}>Caixa diário</h1>
        <span style={{ flex: 1 }} />
        <SeletorMes mes={mes} caminho="/empresa/caixa-diario" />
      </div>
      <AvisoMesFechado fechado={fechado} />
      <IndicadoresDoMes resumo={resumo} meta={doMes.meta} />
      <GradeCaixaDiario
        key={chaveDoMes(mes)}
        formas={formas.map((f) => ({ id: f.id, nome: f.nome }))}
        linhas={linhas}
        totais={Object.fromEntries(
          formas.map((f) => [f.id, reais(resumo.totalPorForma[f.id] ?? ZERO)]),
        )}
        totalGeral={reais(resumo.totalGeral)}
        editavel={podeLancar(papel) && !fechado}
      />
      <section className="pilha">
        <h2>Participação por forma</h2>
        <ParticipacaoPorForma formas={formas} resumo={resumo} />
      </section>
    </div>
  );
}
