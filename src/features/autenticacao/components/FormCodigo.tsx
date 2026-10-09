'use client';

import { useActionState } from 'react';
import { INICIAL, estadoDoFormulario } from '@/lib/erros';
import { Aviso, BotaoEnviar, Campo } from '@/lib/ui';
import { confirmarCodigo } from '../actions';

export function FormCodigo({ fatorId, proximo }: { fatorId: string; proximo?: string | null }) {
  const [resultado, acao] = useActionState(confirmarCodigo, INICIAL);
  const { campos } = estadoDoFormulario(resultado);
  return (
    <form action={acao} className="formulario" noValidate>
      <Aviso resultado={resultado} />
      <input type="hidden" name="fatorId" value={fatorId} />
      {proximo && <input type="hidden" name="proximo" value={proximo} />}
      <Campo
        rotulo="Código do app autenticador"
        nome="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
        erro={campos.codigo}
      />
      <BotaoEnviar>Confirmar</BotaoEnviar>
    </form>
  );
}
