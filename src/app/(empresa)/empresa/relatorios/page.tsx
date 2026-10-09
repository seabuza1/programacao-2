import type { Metadata } from 'next';
import Link from 'next/link';
import { anoDaUrl, mesDaUrl } from '@/app/_componentes/mes';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';
import { listarParametros, parametrosVazios } from '@/features/cadastros';
import { carregarHistorico } from '@/features/fluxo-caixa';
import {
  FormAnalise,
  LIMITE_PRO_LABORE,
  TabelaAnalise,
  TabelaAnual,
  TabelaGerencial,
  TabelaProLabore,
  analiseFaturamento,
  dadosDoAno,
  lerAnalise,
  proLaboreDoAno,
  relatorioAnual,
  resumoDoMes,
} from '@/features/relatorios';
import { chaveDoMes } from '@/lib/datas';
import { SeletorAno, SeletorMes } from '@/lib/ui';

export const metadata: Metadata = { title: 'Relatórios' };

const ABAS = [
  { id: 'gerencial', rotulo: 'Gerencial e DRE' },
  { id: 'anual', rotulo: 'Anual' },
  { id: 'pro-labore', rotulo: 'Pró-labore' },
  { id: 'analise', rotulo: 'Análise de faturamento' },
] as const;

type Aba = (typeof ABAS)[number]['id'];

interface Props {
  searchParams: Promise<{
    aba?: string | string[];
    mes?: string | string[];
    ano?: string | string[];
  }>;
}

export default async function Relatorios({ searchParams }: Props) {
  const { supabase, empresa, papel } = await exigirEmpresa();
  const parametrosUrl = await searchParams;
  const aba: Aba = ABAS.find((a) => a.id === parametrosUrl.aba)?.id ?? 'gerencial';
  const mes = mesDaUrl(parametrosUrl.mes);
  const ano = anoDaUrl(parametrosUrl.ano ?? (parametrosUrl.mes ? String(mes.ano) : undefined));

  return (
    <div className="pilha">
      <h1>Relatórios</h1>
      <nav className="nav" aria-label="Relatórios" style={{ padding: 0 }}>
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`/empresa/relatorios?aba=${a.id}`}
            aria-current={a.id === aba ? 'page' : undefined}
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>
      {aba === 'gerencial' && <Gerencial empresaId={empresa.id} supabase={supabase} mes={mes} />}
      {aba === 'anual' && <Anual empresaId={empresa.id} supabase={supabase} ano={ano} />}
      {aba === 'pro-labore' && <ProLabore empresaId={empresa.id} supabase={supabase} ano={ano} />}
      {aba === 'analise' && (
        <Analise
          empresaId={empresa.id}
          supabase={supabase}
          ano={ano}
          editavel={podeGerenciar(papel)}
        />
      )}
    </div>
  );
}

type Dados = { empresaId: string; supabase: Awaited<ReturnType<typeof exigirEmpresa>>['supabase'] };

async function Gerencial({
  empresaId,
  supabase,
  mes,
}: Dados & { mes: ReturnType<typeof mesDaUrl> }) {
  const [historico, parametros] = await Promise.all([
    carregarHistorico(supabase, empresaId, mes),
    listarParametros(supabase, empresaId),
  ]);
  const { gerencial } = resumoDoMes(
    historico,
    mes,
    parametros[chaveDoMes(mes)] ?? parametrosVazios(),
  );
  return (
    <section className="pilha">
      <div className="linha">
        <SeletorMes mes={mes} caminho="/empresa/relatorios" parametros={{ aba: 'gerencial' }} />
        <Exportar relatorio="gerencial" periodo={chaveDoMes(mes)} />
      </div>
      <p className="suave pequeno">
        Despesas financeiras incluem as taxas de cartão do mês. Lucro = faturamento − fixos −
        variáveis − investimentos.
      </p>
      <TabelaGerencial gerencial={gerencial} />
    </section>
  );
}

async function carregarAno(supabase: Dados['supabase'], empresaId: string, ano: number) {
  const historico = await carregarHistorico(supabase, empresaId, { ano, mes: 12 });
  return { historico, meses: dadosDoAno(historico, ano) };
}

async function Anual({ empresaId, supabase, ano }: Dados & { ano: number }) {
  const { historico, meses } = await carregarAno(supabase, empresaId, ano);
  const anual = relatorioAnual({ formas: historico.formas, contas: historico.contas, meses });
  return (
    <section className="pilha">
      <div className="linha">
        <SeletorAno ano={ano} caminho="/empresa/relatorios" parametros={{ aba: 'anual' }} />
        <Exportar relatorio="anual" periodo={String(ano)} />
      </div>
      <TabelaAnual anual={anual} />
    </section>
  );
}

async function ProLabore({ empresaId, supabase, ano }: Dados & { ano: number }) {
  const { historico, meses } = await carregarAno(supabase, empresaId, ano);
  const proLabore = proLaboreDoAno(historico.contas, meses);
  return (
    <section className="pilha">
      <SeletorAno ano={ano} caminho="/empresa/relatorios" parametros={{ aba: 'pro-labore' }} />
      <TabelaProLabore meses={proLabore.meses} ano={proLabore.ano} limite={LIMITE_PRO_LABORE} />
    </section>
  );
}

async function Analise({
  empresaId,
  supabase,
  ano,
  editavel,
}: Dados & { ano: number; editavel: boolean }) {
  const [{ meses }, { anterior, crescimento }] = await Promise.all([
    carregarAno(supabase, empresaId, ano),
    lerAnalise(supabase, empresaId, ano),
  ]);
  const analise = analiseFaturamento({
    anterior,
    realizado: meses.map((m) => m.faturamento),
    crescimentoDesejado: crescimento,
  });
  return (
    <section className="pilha">
      <SeletorAno ano={ano} caminho="/empresa/relatorios" parametros={{ aba: 'analise' }} />
      <p className="suave pequeno">
        Meta = faturamento do mesmo mês em {ano - 1} × (1 + crescimento desejado). Crescimento =
        realizado ÷ ano anterior − 1.
      </p>
      <TabelaAnalise analise={analise} />
      {editavel && (
        <details className="cartao">
          <summary>Editar ano anterior e crescimento desejado</summary>
          <FormAnalise key={ano} ano={ano} anterior={anterior} crescimento={crescimento} />
        </details>
      )}
    </section>
  );
}

function Exportar({ relatorio, periodo }: { relatorio: string; periodo: string }) {
  const href = (formato: string) =>
    `/empresa/relatorios/exportar?${new URLSearchParams({ relatorio, formato, periodo }).toString()}`;
  return (
    <span className="linha">
      <a className="botao botao-secundario" href={href('xlsx')} download>
        Baixar Excel
      </a>
      <a className="botao botao-secundario" href={href('pdf')} download>
        Baixar PDF
      </a>
    </span>
  );
}
