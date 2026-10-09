import type { Metadata } from 'next';
import Link from 'next/link';
import { FormConfirmarLink } from '@/features/autenticacao';

export const metadata: Metadata = { title: 'Confirmar' };

interface Props {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[] }>;
}

const TITULOS: Record<string, string> = {
  invite: 'Aceitar convite',
  recovery: 'Redefinir senha',
};

export default async function Confirmar({ searchParams }: Props) {
  const { token_hash: tokenHash, type: tipo } = await searchParams;
  if (typeof tokenHash !== 'string' || typeof tipo !== 'string' || !TITULOS[tipo]) {
    return (
      <>
        <h1>Link inválido</h1>
        <p>Peça um novo convite ou uma nova redefinição de senha.</p>
        <Link href="/entrar">Ir para o login</Link>
      </>
    );
  }
  return (
    <>
      <h1>{TITULOS[tipo]}</h1>
      <p>Clique em continuar para escolher sua senha.</p>
      <FormConfirmarLink tokenHash={tokenHash} tipo={tipo} />
    </>
  );
}
