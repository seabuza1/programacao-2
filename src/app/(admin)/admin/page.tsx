import type { Metadata } from 'next';
import { carregarPainel } from '@/app/_componentes/painel';
import { mesDaUrl } from '@/app/_componentes/mes';
import { exigirAdminPlataforma } from '@/features/acesso';
import { LIMIARES, TabelaPainel } from '@/features/painel';
import { Indicador, SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Painel' };

interface Props {
  searchParams: Promise<{ mes?: string | string[] }>;
}

export default async function Painel({ searchParams }: Props) {
  const { supabase } = await exigirAdminPlataforma();
  const mes = mesDaUrl((await searchParams).mes);
  const linhas = await carregarPainel(supabase, mes);
  const comAlerta = linhas.filter((l) => l.alertas.length > 0).length;
  return (
    <div className="pilha">
      <div className="linha">
        <h1 style={{ margin: 0 }}>Painel</h1>
        <span style={{ flex: 1 }} />
        <SeletorMes mes={mes} caminho="/admin" />
      </div>
      <div className="grade">
        <Indicador rotulo="Empresas">{linhas.length}</Indicador>
        <Indicador
          rotulo="Com alerta"
          detalhe={`Sem lançar: mais de ${LIMIARES.diasSemLancar} dias`}
        >
          {comAlerta}
        </Indicador>
      </div>
      <TabelaPainel linhas={linhas} />
      <p className="suave pequeno">
        Mostra só as empresas em que você tem vínculo. Saldos até o fim do mês escolhido.
      </p>
    </div>
  );
}
