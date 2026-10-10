'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useCampoDoFormulario } from './Formulario';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  rotulo: string;
  nome: string;
  erro?: string | undefined;
  ajuda?: string;
}

export function Campo({ rotulo, nome, erro, ajuda, id, defaultValue, ...resto }: Props) {
  const idCampo = id ?? nome;
  const idErro = `${idCampo}-erro`;
  const doFormulario = useCampoDoFormulario(nome);
  const mensagem = erro ?? doFormulario.erro;
  const valorInicial =
    resto.type === 'password' ? undefined : (doFormulario.digitado ?? defaultValue);
  return (
    <div className="campo">
      <label htmlFor={idCampo}>{rotulo}</label>
      <input
        id={idCampo}
        name={nome}
        aria-invalid={mensagem ? true : undefined}
        aria-describedby={mensagem ? idErro : undefined}
        defaultValue={valorInicial}
        {...resto}
      />
      {ajuda && <small className="ajuda">{ajuda}</small>}
      {mensagem && (
        <small id={idErro} className="erro-campo">
          {mensagem}
        </small>
      )}
    </div>
  );
}

interface PropsSelecao extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  rotulo: string;
  nome: string;
  opcoes: { valor: string; nome: string }[];
  children?: ReactNode;
}

export function Selecao({ rotulo, nome, opcoes, id, defaultValue, ...resto }: PropsSelecao) {
  const idCampo = id ?? nome;
  const { erro, digitado } = useCampoDoFormulario(nome);
  return (
    <div className="campo">
      <label htmlFor={idCampo}>{rotulo}</label>
      <select
        id={idCampo}
        name={nome}
        aria-invalid={erro ? true : undefined}
        defaultValue={digitado ?? defaultValue}
        {...resto}
      >
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.nome}
          </option>
        ))}
      </select>
      {erro && <small className="erro-campo">{erro}</small>}
    </div>
  );
}
