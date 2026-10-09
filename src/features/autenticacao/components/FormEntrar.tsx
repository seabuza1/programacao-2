'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { INICIAL, estadoDoFormulario } from '@/lib/erros';
import { Aviso, BotaoEnviar, Campo } from '@/lib/ui';
import { entrar } from '../actions';

export function FormEntrar() {
  const [resultado, acao] = useActionState(entrar, INICIAL);
  const { campos, valores } = estadoDoFormulario(resultado);
  return (
    <form action={acao} className="formulario" noValidate>
      <Aviso resultado={resultado} />
      <Campo
        rotulo="E-mail"
        nome="email"
        type="email"
        autoComplete="username"
        required
        defaultValue={valores.email}
        erro={campos.email}
      />
      <Campo
        rotulo="Senha"
        nome="senha"
        type="password"
        autoComplete="current-password"
        required
        erro={campos.senha}
      />
      <BotaoEnviar>Entrar</BotaoEnviar>
      <Link href="/esqueci-senha">Esqueci minha senha</Link>
    </form>
  );
}
