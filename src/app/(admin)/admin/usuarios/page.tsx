import type { Metadata } from 'next';
import {
  NOME_DO_PAPEL,
  PAPEIS,
  exigirAdminPlataforma,
  listarEmpresasDoUsuario,
} from '@/features/acesso';
import { FormConvite } from '@/features/usuarios';

export const metadata: Metadata = { title: 'Usuários' };

export default async function Usuarios() {
  const { supabase, usuario } = await exigirAdminPlataforma();
  const empresas = (await listarEmpresasDoUsuario(supabase, usuario.id)).filter(
    (empresa) => empresa.papel === 'admin',
  );
  return (
    <section className="pilha">
      <h1>Usuários</h1>
      <div className="cartao pilha">
        <h2>Convidar usuário</h2>
        <p className="suave">
          A pessoa recebe um e-mail para criar a senha. Você só convida para empresas em que é
          administradora.
        </p>
        <FormConvite
          empresas={empresas}
          papeis={PAPEIS.map((papel) => ({ valor: papel, nome: NOME_DO_PAPEL[papel] }))}
        />
      </div>
    </section>
  );
}
