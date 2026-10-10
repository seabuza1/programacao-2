import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BotaoSair } from '@/app/_componentes/BotaoSair';
import {
  lerNivelSessao,
  lerPrecisaMfa,
  obterUsuarioParcial,
  rotaDeRetornoSegura,
} from '@/features/acesso';
import { CadastroAutenticador, FormCodigo, fatorConfirmado } from '@/features/autenticacao';

export const metadata: Metadata = { title: 'Segundo fator' };

interface Props {
  searchParams: Promise<{ proximo?: string | string[] }>;
}

export default async function SegundoFator({ searchParams }: Props) {
  const contexto = await obterUsuarioParcial();
  if (!contexto) {
    redirect('/entrar');
  }
  const proximo = rotaDeRetornoSegura((await searchParams).proximo);
  const [nivel, fatorId, precisaMfa] = await Promise.all([
    lerNivelSessao(contexto.supabase),
    fatorConfirmado(contexto.supabase),
    lerPrecisaMfa(contexto.supabase),
  ]);
  if (nivel === 'aal2' || (!fatorId && !precisaMfa)) {
    redirect(proximo ?? '/');
  }
  return (
    <>
      <h1>Segundo fator</h1>
      {fatorId ? (
        <>
          <p>Digite o código de 6 dígitos do seu app autenticador.</p>
          <FormCodigo fatorId={fatorId} proximo={proximo} />
        </>
      ) : (
        <CadastroAutenticador proximo={proximo} />
      )}
      <BotaoSair />
    </>
  );
}
