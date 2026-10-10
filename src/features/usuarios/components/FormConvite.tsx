'use client';

import { useActionState } from 'react';
import { INICIAL, estadoDoFormulario } from '@/lib/erros';
import { Aviso, BotaoEnviar, Campo } from '@/lib/ui';
import { convidarUsuario } from '../actions';

interface Props {
  empresas: { id: string; nome: string }[];
  papeis: { valor: string; nome: string }[];
}

export function FormConvite({ empresas, papeis }: Props) {
  const [resultado, acao] = useActionState(convidarUsuario, INICIAL);
  const { campos, valores } = estadoDoFormulario(resultado);
  return (
    <form action={acao} className="formulario" noValidate>
      <Aviso resultado={resultado} />
      <Campo
        rotulo="E-mail"
        nome="email"
        type="email"
        required
        defaultValue={valores.email}
        erro={campos.email}
      />
      <div className="campo">
        <label htmlFor="empresaId">Empresa</label>
        <select id="empresaId" name="empresaId" required defaultValue={valores.empresaId ?? ''}>
          <option value="" disabled>
            Escolha…
          </option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nome}
            </option>
          ))}
        </select>
        {campos.empresaId && <small className="erro-campo">{campos.empresaId}</small>}
      </div>
      <div className="campo">
        <label htmlFor="papel">Papel</label>
        <select id="papel" name="papel" required defaultValue={valores.papel ?? 'operador'}>
          {papeis.map((papel) => (
            <option key={papel.valor} value={papel.valor}>
              {papel.nome}
            </option>
          ))}
        </select>
      </div>
      <BotaoEnviar>Enviar convite</BotaoEnviar>
    </form>
  );
}
