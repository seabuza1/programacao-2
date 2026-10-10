'use client';

import { useState, useTransition, type FocusEvent, type KeyboardEvent } from 'react';
import type { Resultado } from '@/lib/erros';
import { salvarCelula, salvarIndicadoresDoDia } from '../actions';

export interface LinhaGrade {
  data: string;
  rotulo: string;
  valores: Record<string, string>;
  total: string;
  indicador: { qtdVendas: string; qtdProdutos: string; descontos: string };
}

interface Props {
  formas: { id: string; nome: string }[];
  linhas: LinhaGrade[];
  totais: Record<string, string>;
  totalGeral: string;
  editavel: boolean;
}

type Situacao = 'salvando' | 'erro';

const INDICADORES = [
  { chave: 'qtdVendas', rotulo: 'Vendas (qtd)', decimal: false },
  { chave: 'qtdProdutos', rotulo: 'Produtos (qtd)', decimal: false },
  { chave: 'descontos', rotulo: 'Descontos', decimal: true },
] as const;

/** Grade de dias × formas, editável como a planilha. Salva ao sair da célula. */
export function GradeCaixaDiario({ formas, linhas, totais, totalGeral, editavel }: Props) {
  const [situacao, setSituacao] = useState<Record<string, Situacao>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [, iniciar] = useTransition();
  const colunas = formas.length + INDICADORES.length;

  function marcar(chave: string, valor: Situacao | null, erro?: string) {
    setSituacao((atual) => {
      const novo = { ...atual };
      if (valor) novo[chave] = valor;
      else delete novo[chave];
      return novo;
    });
    setErros((atual) => {
      const novo = { ...atual };
      if (erro) novo[chave] = erro;
      else delete novo[chave];
      return novo;
    });
  }

  function concluir(chave: string, resultado: Resultado) {
    if (resultado.ok) {
      marcar(chave, null);
    } else {
      const detalhe = resultado.campos ? Object.values(resultado.campos)[0] : undefined;
      marcar(chave, 'erro', detalhe ?? resultado.erro);
    }
  }

  function aoSairDaCelula(evento: FocusEvent<HTMLInputElement>, data: string, formaId: string) {
    const campo = evento.currentTarget;
    const chave = `${data}:${formaId}`;
    if (campo.value === campo.defaultValue) {
      // Voltou ao valor salvo: some o erro que houver na célula.
      if (situacao[chave]) marcar(chave, null);
      return;
    }
    marcar(chave, 'salvando');
    iniciar(async () => {
      const resultado = await salvarCelula({ data, formaId, valor: campo.value });
      if (resultado.ok) campo.defaultValue = campo.value;
      concluir(chave, resultado);
    });
  }

  function aoSairDoIndicador(evento: FocusEvent<HTMLInputElement>, data: string) {
    const campo = evento.currentTarget;
    const chave = `${data}:indicadores`;
    if (campo.value === campo.defaultValue) {
      if (situacao[chave]) marcar(chave, null);
      return;
    }
    const linha = campo.closest('tr');
    const valor = (nome: string) =>
      linha?.querySelector<HTMLInputElement>(`input[data-indicador="${nome}"]`)?.value ?? '';
    marcar(chave, 'salvando');
    iniciar(async () => {
      const resultado = await salvarIndicadoresDoDia({
        data,
        qtdVendas: valor('qtdVendas'),
        qtdProdutos: valor('qtdProdutos'),
        descontos: valor('descontos'),
      });
      if (resultado.ok) campo.defaultValue = campo.value;
      concluir(chave, resultado);
    });
  }

  /** Enter desce para o mesmo campo do dia seguinte. */
  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    const { linha, coluna } = evento.currentTarget.dataset;
    const proximo = document.querySelector<HTMLInputElement>(
      `input[data-linha="${Number(linha) + 1}"][data-coluna="${coluna}"]`,
    );
    (proximo ?? evento.currentTarget).focus();
    proximo?.select();
  }

  const classe = (chave: string) =>
    situacao[chave] === 'salvando'
      ? 'celula-salvando'
      : situacao[chave] === 'erro'
        ? 'celula-erro'
        : undefined;
  const listaDeErros = Object.entries(erros);

  return (
    <div className="pilha">
      {listaDeErros.length > 0 && (
        <div role="alert" className="aviso aviso-erro">
          {listaDeErros.map(([chave, erro]) => (
            <div key={chave}>
              {chave.slice(8, 10)}/{chave.slice(5, 7)}: {erro}
            </div>
          ))}
        </div>
      )}
      <div className="rolagem" style={{ maxHeight: '70vh' }}>
        <table className="tabela">
          <thead>
            <tr>
              <th className="fixa">Dia</th>
              {formas.map((forma) => (
                <th key={forma.id} className="num" style={{ whiteSpace: 'normal', minWidth: 110 }}>
                  {forma.nome}
                </th>
              ))}
              <th className="num">Total do dia</th>
              {INDICADORES.map((i) => (
                <th key={i.chave} className="num">
                  {i.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, indice) => (
              <tr key={linha.data}>
                <th className="fixa" scope="row">
                  {linha.rotulo}
                </th>
                {formas.map((forma, coluna) => {
                  const chave = `${linha.data}:${forma.id}`;
                  return (
                    <td key={forma.id} className={classe(chave)}>
                      <input
                        aria-label={`${forma.nome} em ${linha.rotulo}`}
                        inputMode="decimal"
                        defaultValue={linha.valores[forma.id] ?? ''}
                        disabled={!editavel}
                        data-linha={indice}
                        data-coluna={coluna}
                        onBlur={(e) => aoSairDaCelula(e, linha.data, forma.id)}
                        onKeyDown={aoTeclar}
                      />
                    </td>
                  );
                })}
                <td className="num">{linha.total}</td>
                {INDICADORES.map((indicador, i) => (
                  <td key={indicador.chave} className={classe(`${linha.data}:indicadores`)}>
                    <input
                      aria-label={`${indicador.rotulo} em ${linha.rotulo}`}
                      inputMode={indicador.decimal ? 'decimal' : 'numeric'}
                      defaultValue={linha.indicador[indicador.chave]}
                      disabled={!editavel}
                      data-indicador={indicador.chave}
                      data-linha={indice}
                      data-coluna={colunas - INDICADORES.length + i}
                      onBlur={(e) => aoSairDoIndicador(e, linha.data)}
                      onKeyDown={aoTeclar}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="fixa">Total</td>
              {formas.map((forma) => (
                <td key={forma.id} className="num">
                  {totais[forma.id]}
                </td>
              ))}
              <td className="num">{totalGeral}</td>
              <td colSpan={INDICADORES.length} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
