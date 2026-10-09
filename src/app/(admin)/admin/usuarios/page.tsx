import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NOME_DO_PAPEL,
  PAPEIS,
  exigirAdminPlataforma,
  listarEmpresasDoUsuario,
} from '@/features/acesso';
import { FormConvite, ListaVinculos, listarVinculos } from '@/features/usuarios';

export const metadata: Metadata = { title: 'Usuários' };

export default async function Usuarios() {
  const { supabase, usuario } = await exigirAdminPlataforma();
  const empresas = (await listarEmpresasDoUsuario(supabase, usuario.id)).filter(
    (empresa) => empresa.papel === 'admin',
  );
  const vinculos = await Promise.all(empresas.map((e) => listarVinculos(supabase, e.id)));
  const papeis = PAPEIS.map((papel) => ({ valor: papel, nome: NOME_DO_PAPEL[papel] }));
  return (
    <div className="pilha">
      <h1>Usuários</h1>
      <section className="cartao pilha">
        <h2>Convidar usuário</h2>
        <p className="suave">
          A pessoa recebe um e-mail para criar a senha. Se já tiver conta, só ganha o acesso à
          empresa. Você só convida para empresas em que é administradora.
        </p>
        <FormConvite empresas={empresas} papeis={papeis} />
      </section>
      {empresas.map((empresa, i) => (
        <section key={empresa.id} className="pilha">
          <h2>
            <Link href={`/admin/empresas/${empresa.id}`}>{empresa.nome}</Link>
          </h2>
          <ListaVinculos vinculos={vinculos[i] ?? []} papeis={papeis} editavel />
        </section>
      ))}
    </div>
  );
}
