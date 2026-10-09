import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  rotulo: string;
  nome: string;
  erro?: string | undefined;
  ajuda?: string;
}

export function Campo({ rotulo, nome, erro, ajuda, id, ...resto }: Props) {
  const idCampo = id ?? nome;
  const idErro = `${idCampo}-erro`;
  return (
    <div className="campo">
      <label htmlFor={idCampo}>{rotulo}</label>
      <input
        id={idCampo}
        name={nome}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        {...resto}
      />
      {ajuda && <small className="ajuda">{ajuda}</small>}
      {erro && (
        <small id={idErro} className="erro-campo">
          {erro}
        </small>
      )}
    </div>
  );
}
