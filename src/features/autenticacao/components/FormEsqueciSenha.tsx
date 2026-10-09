'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { INICIAL, estadoDoFormulario } from '@/lib/erros';
import { Aviso, BotaoEnviar, Campo } from '@/lib/ui';
import { esqueciSenha } from '../actions';

export function FormEsqueciSenha() {
  const [resultado, acao] = useActionState(esqueciSenha, INICIAL);
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
      <BotaoEnviar>Enviar link</BotaoEnviar>
      <Link href="/entrar">Voltar para o login</Link>
    </form>
  );
}
