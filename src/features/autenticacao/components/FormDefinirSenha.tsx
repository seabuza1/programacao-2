'use client';

import { useActionState } from 'react';
import { INICIAL, estadoDoFormulario } from '@/lib/erros';
import { Aviso, BotaoEnviar, Campo } from '@/lib/ui';
import { definirSenha } from '../actions';

export function FormDefinirSenha() {
  const [resultado, acao] = useActionState(definirSenha, INICIAL);
  const { campos } = estadoDoFormulario(resultado);
  return (
    <form action={acao} className="formulario" noValidate>
      <Aviso resultado={resultado} />
      <Campo
        rotulo="Nova senha"
        nome="senha"
        type="password"
        autoComplete="new-password"
        ajuda="Pelo menos 10 caracteres, com letras e números."
        required
        erro={campos.senha}
      />
      <Campo
        rotulo="Repita a senha"
        nome="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        erro={campos.confirmacao}
      />
      <BotaoEnviar>Salvar senha</BotaoEnviar>
    </form>
  );
}
