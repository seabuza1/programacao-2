import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lerNivelSessao, obterUsuarioParcial } from '@/features/acesso';
import { FormDefinirSenha, fatorConfirmado } from '@/features/autenticacao';

export const metadata: Metadata = { title: 'Definir senha' };

export default async function DefinirSenha() {
  const contexto = await obterUsuarioParcial();
  if (!contexto) {
    redirect('/entrar');
  }
  // Quem já tem autenticador confirma o código antes de trocar a senha.
  const [fatorId, nivel] = await Promise.all([
    fatorConfirmado(contexto.supabase),
    lerNivelSessao(contexto.supabase),
  ]);
  if (fatorId && nivel !== 'aal2') {
    redirect('/entrar/segundo-fator?proximo=/definir-senha');
  }
  return (
    <>
      <h1>Definir senha</h1>
      <p className="suave">{contexto.usuario.email}</p>
      <FormDefinirSenha />
    </>
  );
}
