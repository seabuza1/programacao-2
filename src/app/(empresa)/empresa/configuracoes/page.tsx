import type { Metadata } from 'next';
import { mesDaUrl } from '@/app/_componentes/mes';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';
import {
  FormParametros,
  FormSaldosIniciais,
  ListaContas,
  ListaFormas,
  lerSaldosIniciais,
  listarContas,
  listarFormas,
  listarParametros,
  parametrosVazios,
} from '@/features/cadastros';
import { listarMesesFechados } from '@/features/fechamento';
import { chaveDoMes } from '@/lib/datas';
import { SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Configurações' };

interface Props {
  searchParams: Promise<{ mes?: string | string[] }>;
}

export default async function Configuracoes({ searchParams }: Props) {
  const { supabase, empresa, papel } = await exigirEmpresa();
  if (!podeGerenciar(papel)) {
    return (
      <p className="aviso aviso-erro">Só a administradora e o dono alteram as configurações.</p>
    );
  }
  const mes = mesDaUrl((await searchParams).mes);
  const [formas, contas, parametros, saldos, fechados] = await Promise.all([
    listarFormas(supabase, empresa.id),
    listarContas(supabase, empresa.id),
    listarParametros(supabase, empresa.id),
    lerSaldosIniciais(supabase, empresa.id),
    listarMesesFechados(supabase, empresa.id),
  ]);
  return (
    <div className="pilha">
      <h1>Configurações</h1>

      <section className="cartao pilha" aria-labelledby="parametros">
        <div className="linha">
          <h2 id="parametros" style={{ margin: 0 }}>
            Parâmetros do mês
          </h2>
          <span className="espaco" style={{ flex: 1 }} />
          <SeletorMes mes={mes} caminho="/empresa/configuracoes" />
        </div>
        <FormParametros
          key={chaveDoMes(mes)}
          mes={mes}
          parametros={parametros[chaveDoMes(mes)] ?? parametrosVazios()}
          bloqueado={fechados.has(chaveDoMes(mes))}
        />
      </section>

      <section className="cartao pilha" aria-labelledby="saldos">
        <h2 id="saldos">Saldos iniciais</h2>
        <p className="suave">
          Valem no primeiro dia do mês de início. Lançamentos de meses anteriores não entram no
          saldo.
        </p>
        <FormSaldosIniciais saldos={saldos} mesPadrao={mes} bloqueado={fechados.size > 0} />
        {fechados.size > 0 && (
          <p className="aviso aviso-alerta">
            Há mês fechado. Reabra os meses para alterar os saldos iniciais.
          </p>
        )}
      </section>

      <section className="cartao pilha" aria-labelledby="formas">
        <h2 id="formas">Formas de recebimento</h2>
        <ListaFormas formas={formas} />
      </section>

      <section className="cartao pilha" aria-labelledby="contas">
        <h2 id="contas">Plano de contas</h2>
        <ListaContas contas={contas} />
      </section>
    </div>
  );
}
