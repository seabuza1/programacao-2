'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { INICIAL, estadoDoFormulario } from '@/lib/erros';
import { Aviso, BotaoEnviar, Campo, CampoArmadilha, DesafioTurnstile } from '@/lib/ui';
import { entrar } from '../actions';

export function FormEntrar({ chaveTurnstile }: { chaveTurnstile: string | null }) {
  const [resultado, acao] = useActionState(entrar, INICIAL);
  const { campos, valores } = estadoDoFormulario(resultado);
  return (
    <form action={acao} className="formulario" noValidate>
      <Aviso resultado={resultado} />
      <CampoArmadilha />
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
      {chaveTurnstile && <DesafioTurnstile chave={chaveTurnstile} versao={resultado} />}
      <BotaoEnviar>Entrar</BotaoEnviar>
      <Link href="/esqueci-senha">Esqueci minha senha</Link>
    </form>
  );
}
