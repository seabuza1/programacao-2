import type { Metadata } from 'next';
import { mesDaUrl } from '@/app/_componentes/mes';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';
import {
  FormMarkup,
  FormProduto,
  TabelaProdutos,
  calcularMarkup,
  lerParametrosMarkup,
  listarProdutos,
  type ParametrosMarkup,
} from '@/features/precificacao';
import { chaveDoMes } from '@/lib/datas';
import { percentual } from '@/lib/percent';
import { SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Precificação' };

interface Props {
  searchParams: Promise<{ mes?: string | string[] }>;
}

const zero = percentual(0);
const SEM_PARAMETROS: ParametrosMarkup = {
  taxaCartao: zero,
  despesaFixa: zero,
  imposto: zero,
  comissao: zero,
  investimentos: zero,
  margemLucro: zero,
};

export default async function Precificacao({ searchParams }: Props) {
  const { supabase, empresa, papel } = await exigirEmpresa();
  const mes = mesDaUrl((await searchParams).mes);
  const [parametros, produtos] = await Promise.all([
    lerParametrosMarkup(supabase, empresa.id, mes),
    listarProdutos(supabase, empresa.id, mes),
  ]);
  const resultado = calcularMarkup(parametros ?? SEM_PARAMETROS);
  const editavel = podeGerenciar(papel);
  return (
    <div className="pilha">
      <div className="linha">
        <h1 style={{ margin: 0 }}>Precificação</h1>
        <span style={{ flex: 1 }} />
        <SeletorMes mes={mes} caminho="/empresa/precificacao" />
      </div>
      <section className="cartao pilha">
        <h2>Percentuais sobre o preço de venda</h2>
        {!parametros && <p className="suave">Ainda não há percentuais para este mês.</p>}
        <FormMarkup
          key={chaveDoMes(mes)}
          mes={mes}
          parametros={parametros ?? SEM_PARAMETROS}
          resultado={resultado}
          editavel={editavel}
        />
      </section>
      <section className="pilha">
        <h2>Produtos</h2>
        <TabelaProdutos produtos={produtos} resultado={resultado} editavel={editavel} />
        {editavel && (
          <div className="cartao">
            <FormProduto mes={mes} />
          </div>
        )}
      </section>
    </div>
  );
}
