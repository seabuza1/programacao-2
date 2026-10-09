'use client';

import { useState } from 'react';
import { BotaoEnviar, Campo, Formulario, Selecao } from '@/lib/ui';
import { lancarMovimentacao } from '../actions';

interface Props {
  dataPadrao: string;
  dataMinima: string;
  dataMaxima: string;
  contas: { valor: string; nome: string }[];
}

/** Lançamento no livro. Conta só para saída; origem só para entrada. */
export function FormMovimentacao({ dataPadrao, dataMinima, dataMaxima, contas }: Props) {
  const [tipo, setTipo] = useState('saida');
  return (
    <Formulario acao={lancarMovimentacao}>
      <div className="formulario-linha">
        <Campo
          rotulo="Data"
          nome="data"
          type="date"
          defaultValue={dataPadrao}
          min={dataMinima}
          max={dataMaxima}
        />
        <Selecao
          rotulo="Tipo"
          nome="tipo"
          defaultValue="saida"
          onChange={(e) => setTipo(e.currentTarget.value)}
          opcoes={[
            { valor: 'saida', nome: 'Saída' },
            { valor: 'entrada', nome: 'Entrada' },
            { valor: 'transferencia', nome: 'Transferência' },
          ]}
        />
        <Selecao
          rotulo={tipo === 'transferencia' ? 'Sai de' : 'Caixa'}
          nome="caixa"
          defaultValue="banco"
          opcoes={[
            { valor: 'banco', nome: 'Banco' },
            { valor: 'dinheiro', nome: 'Dinheiro' },
          ]}
        />
        <Campo rotulo="Valor (R$)" nome="valor" inputMode="decimal" placeholder="0,00" />
        {tipo === 'saida' && (
          <Selecao
            rotulo="Conta"
            nome="contaId"
            defaultValue=""
            opcoes={[{ valor: '', nome: 'Escolha…' }, ...contas]}
          />
        )}
        {tipo === 'entrada' && (
          <Selecao
            rotulo="Origem"
            nome="origem"
            defaultValue="outro"
            opcoes={[
              { valor: 'recebimento_crediario', nome: 'Recebimento de crediário' },
              { valor: 'outro', nome: 'Outra entrada' },
            ]}
          />
        )}
        <Campo rotulo="Descrição" nome="descricao" maxLength={200} />
      </div>
      {tipo === 'entrada' && (
        <p className="suave pequeno">Entrada no livro nunca conta como faturamento.</p>
      )}
      <BotaoEnviar>Lançar</BotaoEnviar>
    </Formulario>
  );
}
