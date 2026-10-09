import type { Metadata } from 'next';
import { FormEsqueciSenha } from '@/features/autenticacao';

export const metadata: Metadata = { title: 'Esqueci minha senha' };

export default function EsqueciSenha() {
  return (
    <>
      <h1>Esqueci minha senha</h1>
      <p className="suave">Enviaremos um link para você escolher uma nova senha.</p>
      <FormEsqueciSenha />
    </>
  );
}
