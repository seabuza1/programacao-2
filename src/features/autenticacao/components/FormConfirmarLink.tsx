'use client';

import { useActionState } from 'react';
import { INICIAL } from '@/lib/erros';
import { Aviso, BotaoEnviar } from '@/lib/ui';
import { confirmarEmail } from '../actions';

/** Botão em vez de confirmar no GET: leitores de link em e-mail não gastam o token. */
export function FormConfirmarLink({ tokenHash, tipo }: { tokenHash: string; tipo: string }) {
  const [resultado, acao] = useActionState(confirmarEmail, INICIAL);
  return (
    <form action={acao} className="formulario">
      <Aviso resultado={resultado} />
      <input type="hidden" name="tokenHash" value={tokenHash} />
      <input type="hidden" name="tipo" value={tipo} />
      <BotaoEnviar>Continuar</BotaoEnviar>
    </form>
  );
}
