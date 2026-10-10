'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

interface Props {
  children: ReactNode;
  variante?: 'primario' | 'secundario' | 'perigo';
  confirmar?: string;
}

export function BotaoEnviar({ children, variante = 'primario', confirmar }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`botao botao-${variante}`}
      disabled={pending}
      aria-busy={pending}
      onClick={(evento) => {
        if (confirmar && !window.confirm(confirmar)) {
          evento.preventDefault();
        }
      }}
    >
      {pending ? 'Aguarde…' : children}
    </button>
  );
}
