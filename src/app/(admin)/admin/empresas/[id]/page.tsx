import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { carregarPainel } from '@/app/_componentes/painel';
import { NOME_DO_PAPEL, PAPEIS, escolherEmpresa, exigirAdminPlataforma } from '@/features/acesso';
import {
  FormAnotacao,
  ListaAnotacoes,
  ehAdminDaEmpresa,
  listarAnotacoes,
} from '@/features/anotacoes';
import { FormEmpresa, lerEmpresa } from '@/features/empresas';
import { ZonaLgpd } from '@/features/lgpd';
import { SelosDeAlerta } from '@/features/painel';
import { ListaVinculos, listarVinculos } from '@/features/usuarios';
import { mesAtual, nomeDoMes } from '@/lib/datas';
import { Indicador, Reais } from '@/lib/ui';

export const metadata: Metadata = { title: 'Empresa' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheEmpresa({ params }: Props) {
  const { supabase } = await exigirAdminPlataforma();
  const { id } = await params;
  // RLS: sem vínculo, a empresa não é encontrada.
  const empresa = /^[0-9a-f-]{36}$/i.test(id) ? await lerEmpresa(supabase, id) : null;
  if (!empresa) {
    notFound();
  }
  const mes = mesAtual(new Date());
  const [painel, anotacoes, vinculos, ehAdmin] = await Promise.all([
    carregarPainel(supabase, mes),
    listarAnotacoes(supabase, empresa.id),
    listarVinculos(supabase, empresa.id),
    ehAdminDaEmpresa(supabase, empresa.id),
  ]);
  const resumo = painel.find((l) => l.linha.empresaId === empresa.id);
  return (
    <div className="pilha">
      <div className="linha">
        <h1 style={{ margin: 0 }}>{empresa.nome}</h1>
        <span style={{ flex: 1 }} />
        <form action={escolherEmpresa}>
          <input type="hidden" name="empresaId" value={empresa.id} />
          <button type="submit" className="botao botao-secundario">
            Abrir área da empresa
          </button>
        </form>
      </div>
      {resumo && (
        <section className="pilha">
          <h2>{nomeDoMes(mes)}</h2>
          <SelosDeAlerta alertas={resumo.alertas} />
          <div className="grade">
            <Indicador rotulo="Faturamento">
              <Reais valor={resumo.linha.faturamento} />
            </Indicador>
            <Indicador
              rotulo="Previsão"
              detalhe={
                resumo.linha.meta > 0 ? (
                  <>
                    Meta <Reais valor={resumo.linha.meta} />
                  </>
                ) : (
                  'Sem meta'
                )
              }
            >
              <Reais valor={resumo.linha.previsao} />
            </Indicador>
            <Indicador rotulo="Lucro">
              <Reais valor={resumo.linha.lucro} />
            </Indicador>
            <Indicador rotulo="Dinheiro">
              <Reais valor={resumo.linha.saldoDinheiro} />
            </Indicador>
            <Indicador rotulo="Banco">
              <Reais valor={resumo.linha.saldoBanco} />
            </Indicador>
          </div>
        </section>
      )}
      <section className="cartao pilha">
        <h2>Anotações</h2>
        {ehAdmin && <FormAnotacao empresaId={empresa.id} />}
        <ListaAnotacoes anotacoes={anotacoes} mostrarVisibilidade />
      </section>
      <section className="cartao pilha">
        <h2>Usuários</h2>
        <ListaVinculos
          vinculos={vinculos}
          papeis={PAPEIS.map((p) => ({ valor: p, nome: NOME_DO_PAPEL[p] }))}
          editavel={ehAdmin}
        />
      </section>
      <section className="cartao pilha">
        <h2>Dados da empresa</h2>
        <FormEmpresa empresa={empresa} />
      </section>
      {ehAdmin && (
        <section className="cartao pilha">
          <h2>Dados pessoais (LGPD)</h2>
          <ZonaLgpd empresa={empresa} />
        </section>
      )}
    </div>
  );
}
