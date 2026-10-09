import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirAdminPlataforma } from '@/features/acesso';
import { FormNovaEmpresa, listarEmpresas } from '@/features/empresas';
import { NOME_DO_SETOR } from '@/features/precificacao';

export const metadata: Metadata = { title: 'Empresas' };

interface Props {
  searchParams: Promise<{ excluida?: string }>;
}

export default async function Empresas({ searchParams }: Props) {
  const { supabase } = await exigirAdminPlataforma();
  const empresas = await listarEmpresas(supabase);
  const { excluida } = await searchParams;
  return (
    <div className="pilha">
      <h1>Empresas</h1>
      {excluida === '1' && <p className="aviso aviso-ok">Empresa e dados excluídos.</p>}
      {excluida === 'parcial' && (
        <p className="aviso aviso-alerta">
          Empresa excluída, mas alguma conta de usuário não pôde ser apagada. Veja
          docs/incidente.md.
        </p>
      )}
      <section className="cartao pilha">
        <h2>Nova empresa</h2>
        <FormNovaEmpresa />
      </section>
      <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Setor</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr key={empresa.id}>
                <td>
                  <Link href={`/admin/empresas/${empresa.id}`}>{empresa.nome}</Link>
                </td>
                <td>{empresa.setor ? NOME_DO_SETOR[empresa.setor] : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
