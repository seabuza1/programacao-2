'use client';

import { createContext, useActionState, useContext, useState, type ReactNode } from 'react';
import { INICIAL, type Resultado } from '@/lib/erros';
import { Aviso } from './Aviso';

interface Estado {
  campos: Record<string, string>;
  valores: Record<string, string>;
}

const ContextoFormulario = createContext<Estado>({ campos: {}, valores: {} });

/** Erro e valor digitado de um campo do formulário em volta. */
export function useCampoDoFormulario(nome: string) {
  const { campos, valores } = useContext(ContextoFormulario);
  return { erro: campos[nome], digitado: valores[nome] };
}

type Acao = (anterior: Resultado, formData: FormData) => Promise<Resultado>;

/**
 * Formulário ligado a uma Server Action. Mostra o aviso do resultado, passa os erros para
 * cada campo e, se der erro, mantém o que foi digitado (o React limpa o formulário a cada envio).
 */
export function Formulario({
  acao,
  children,
  className = 'formulario',
}: {
  acao: Acao;
  children: ReactNode;
  className?: string;
}) {
  const [resultado, despachar] = useActionState(acao, INICIAL);
  const [digitado, setDigitado] = useState<Record<string, string>>({});
  const estado: Estado = resultado.ok
    ? { campos: {}, valores: {} }
    : { campos: resultado.campos ?? {}, valores: digitado };
  return (
    <form
      className={className}
      noValidate
      action={(formData) => {
        const valores: Record<string, string> = {};
        formData.forEach((valor, nome) => {
          if (typeof valor === 'string') valores[nome] = valor;
        });
        setDigitado(valores);
        despachar(formData);
      }}
    >
      <Aviso resultado={resultado} />
      <ContextoFormulario value={estado}>{children}</ContextoFormulario>
    </form>
  );
}
