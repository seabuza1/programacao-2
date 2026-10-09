import type { Metadata } from 'next';
import { mesDaUrl } from '@/app/_componentes/mes';
import { exigirEmpresa, podeLancar } from '@/features/acesso';
import {
  NOME_DO_GRUPO,
  listarParametros,
  ordenarContas,
  parametrosVazios,
} from '@/features/cadastros';
import { AvisoMesFechado, listarMesesFechados } from '@/features/fechamento';
import { FormMovimentacao, TabelaLivro, carregarHistorico } from '@/features/fluxo-caixa';
import { resumoDoMes } from '@/features/relatorios';
import { chaveDoMes, hojeEmSaoPaulo, nomeDoMes, primeiroDia, ultimoDia } from '@/lib/datas';
import { Indicador, Reais, SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Fluxo de caixa' };

interface Props {
  searchParams: Promise<{ mes?: string | string[] }>;
}

export default async function FluxoCaixa({ searchParams }: Props) {
  const { supabase, empresa, papel } = await exigirEmpresa();
  const mes = mesDaUrl((await searchParams).mes);
  const [historico, parametros, fechados] = await Promise.all([
    carregarHistorico(supabase, empresa.id, mes),
    listarParametros(supabase, empresa.id),
    listarMesesFechados(supabase, empresa.id),
  ]);
  const resumo = resumoDoMes(historico, mes, parametros[chaveDoMes(mes)] ?? parametrosVazios());
  const fechado = fechados.has(chaveDoMes(mes));
  const editavel = podeLancar(papel) && !fechado;
  const hoje = hojeEmSaoPaulo(new Date());
  const [de, ate] = [primeiroDia(mes), ultimoDia(mes)];
  const contas = ordenarContas(historico.contas)
    .filter((c) => c.ativa)
    .map((c) => ({ valor: c.id, nome: `${c.nome} (${NOME_DO_GRUPO[c.grupo]})` }));

  return (
    <div className="pilha">
      <div className="linha">
        <h1 style={{ margin: 0 }}>Fluxo de caixa</h1>
        <span style={{ flex: 1 }} />
        <SeletorMes mes={mes} caminho="/empresa/fluxo-caixa" />
      </div>
      <AvisoMesFechado fechado={fechado} />
      {!resumo.livro ? (
        <p className="aviso aviso-alerta">
          {nomeDoMes(mes)} é anterior ao mês de início dos saldos. Escolha um mês a partir do
          início.
        </p>
      ) : (
        <>
          <div className="grade">
            <Indicador
              rotulo="Dinheiro"
              detalhe={
                <>
                  Início do mês: <Reais valor={resumo.livro.saldoInicial.dinheiro} />
                </>
              }
            >
              <Reais valor={resumo.livro.saldoFinal.dinheiro} />
            </Indicador>
            <Indicador
              rotulo="Banco"
              detalhe={
                <>
                  Início do mês: <Reais valor={resumo.livro.saldoInicial.banco} />
                </>
              }
            >
              <Reais valor={resumo.livro.saldoFinal.banco} />
            </Indicador>
            <Indicador rotulo="Taxas de cartão no mês">
              <Reais valor={resumo.despesasCartao} />
            </Indicador>
            <Indicador rotulo="Crediário a receber" detalhe="Vendido no carnê e ainda não pago">
              <Reais valor={resumo.crediario} />
            </Indicador>
          </div>
          {editavel && (
            <section className="cartao pilha">
              <h2>Novo lançamento</h2>
              <FormMovimentacao
                key={chaveDoMes(mes)}
                dataPadrao={hoje >= de && hoje <= ate ? hoje : de}
                dataMinima={de}
                dataMaxima={ate}
                contas={contas}
              />
            </section>
          )}
          <section className="pilha">
            <h2>Livro do mês</h2>
            <p className="suave pequeno">
              Entradas do caixa diário e taxas de cartão são automáticas: mudam pelo caixa diário ou
              pela taxa do mês.
            </p>
            <TabelaLivro livro={resumo.livro} editavel={editavel} />
          </section>
        </>
      )}
    </div>
  );
}
