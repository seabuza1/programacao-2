import type { Metadata } from 'next';
import Link from 'next/link';
import { mesDaUrl } from '@/app/_componentes/mes';
import { exigirEmpresa } from '@/features/acesso';
import { listarParametros, parametrosVazios } from '@/features/cadastros';
import {
  Fechamento,
  listarMesesFechados,
  podeFecharAte,
  podeFecharMes,
} from '@/features/fechamento';
import { carregarHistorico } from '@/features/fluxo-caixa';
import { resumoDoMes } from '@/features/relatorios';
import { chaveDoMes, mesAtual } from '@/lib/datas';
import { Indicador, Pct, Reais, SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Resumo do mês' };

interface Props {
  searchParams: Promise<{ mes?: string | string[] }>;
}

export default async function Resumo({ searchParams }: Props) {
  const { supabase, empresa, papel } = await exigirEmpresa();
  const mes = mesDaUrl((await searchParams).mes);
  const [historico, parametros, fechados] = await Promise.all([
    carregarHistorico(supabase, empresa.id, mes),
    listarParametros(supabase, empresa.id),
    listarMesesFechados(supabase, empresa.id),
  ]);
  const doMes = parametros[chaveDoMes(mes)] ?? parametrosVazios();
  const { caixa, livro, gerencial, crediario } = resumoDoMes(historico, mes, doMes);
  const fechado = fechados.has(chaveDoMes(mes));
  const podeAlterar = podeFecharMes(papel) && (fechado || podeFecharAte(mes, mesAtual(new Date())));

  return (
    <div className="pilha">
      <div className="linha">
        <h1 style={{ margin: 0 }}>Resumo do mês</h1>
        <span style={{ flex: 1 }} />
        <SeletorMes mes={mes} caminho="/empresa" />
      </div>
      <Fechamento mes={mes} fechado={fechado} podeAlterar={podeAlterar} />
      <div className="grade">
        <Indicador rotulo="Faturamento">
          <Reais valor={caixa.faturamento} />
        </Indicador>
        <Indicador
          rotulo="Previsão de fechamento"
          detalhe={
            doMes.meta > 0 ? (
              <>
                Meta <Reais valor={doMes.meta} />{' '}
                {caixa.previsaoAbaixoDaMeta ? (
                  <span className="selo selo-alerta">abaixo da meta</span>
                ) : caixa.previsao !== null ? (
                  <span className="selo selo-ok">na meta</span>
                ) : null}
              </>
            ) : (
              <Link href={`/empresa/configuracoes?mes=${chaveDoMes(mes)}`}>Cadastrar meta</Link>
            )
          }
        >
          <Reais valor={caixa.previsao} />
        </Indicador>
        <Indicador rotulo="Saldo em dinheiro">
          <Reais valor={livro?.saldoFinal.dinheiro ?? null} />
        </Indicador>
        <Indicador rotulo="Saldo no banco">
          <Reais valor={livro?.saldoFinal.banco ?? null} />
        </Indicador>
        <Indicador rotulo="Lucro do mês" detalhe={<Pct valor={gerencial.percentualLucro} />}>
          <Reais valor={gerencial.lucro} />
        </Indicador>
        <Indicador rotulo="Crediário a receber">
          <Reais valor={crediario} />
        </Indicador>
      </div>
      {!livro && (
        <p className="aviso aviso-alerta">Este mês é anterior ao mês de início dos saldos.</p>
      )}
    </div>
  );
}
