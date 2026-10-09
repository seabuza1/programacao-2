import type { Metadata } from 'next';
import Link from 'next/link';
import { BotaoSair } from '@/app/_componentes/BotaoSair';
import {
  NOME_DO_PAPEL,
  escolherEmpresa,
  exigirUsuario,
  listarEmpresasDoUsuario,
} from '@/features/acesso';

export const metadata: Metadata = { title: 'Escolher empresa' };

export default async function EscolherEmpresa() {
  const { supabase, usuario } = await exigirUsuario();
  const empresas = await listarEmpresasDoUsuario(supabase, usuario.id);
  return (
    <main className="publico">
      <div className="cartao pilha">
        <span className="marca">Gestão Fácil</span>
        <h1>Escolha a empresa</h1>
        {empresas.length === 0 && <p>Você ainda não tem acesso a nenhuma empresa.</p>}
        {empresas.map((empresa) => (
          <form key={empresa.id} action={escolherEmpresa}>
            <input type="hidden" name="empresaId" value={empresa.id} />
            <button type="submit" className="botao botao-secundario" style={{ width: '100%' }}>
              {empresa.nome} · {NOME_DO_PAPEL[empresa.papel]}
            </button>
          </form>
        ))}
        {usuario.adminPlataforma && <Link href="/admin">Painel da administradora</Link>}
        <BotaoSair />
      </div>
    </main>
  );
}
