import { chaveDoMes, type Mes } from '@/lib/datas';
import { formatarPercentual } from '@/lib/percent';
import { BotaoEnviar, Campo, Formulario, Pct, Reais } from '@/lib/ui';
import { adicionarProduto, removerProduto, salvarMarkup } from '../actions';
import {
  FAIXAS_DE_MARGEM,
  NOME_DO_SETOR,
  ROTULOS_MARKUP,
  custoTotal,
  formatarFator,
  precoSugerido,
  type ParametrosMarkup,
  type ProdutoPreco,
  type ResultadoMarkup,
  type Setor,
} from '../service';

const CAMPOS = Object.keys(ROTULOS_MARKUP) as (keyof ParametrosMarkup)[];

export function FormMarkup({
  mes,
  parametros,
  resultado,
  editavel,
}: {
  mes: Mes;
  parametros: ParametrosMarkup;
  resultado: ResultadoMarkup;
  editavel: boolean;
}) {
  return (
    <div className="pilha">
      <Formulario acao={salvarMarkup}>
        <input type="hidden" name="mes" value={chaveDoMes(mes)} />
        <fieldset
          disabled={!editavel}
          className="formulario-linha"
          style={{ border: 0, padding: 0, margin: 0 }}
        >
          {CAMPOS.map((campo) => (
            <Campo
              key={campo}
              rotulo={`${ROTULOS_MARKUP[campo]} (%)`}
              nome={campo}
              inputMode="decimal"
              defaultValue={formatarPercentual(parametros[campo])}
            />
          ))}
        </fieldset>
        {editavel && <BotaoEnviar>Salvar percentuais</BotaoEnviar>}
      </Formulario>
      {resultado.ok ? (
        <p>
          Soma dos percentuais: <Pct valor={resultado.soma} /> · Markup:{' '}
          <strong>{formatarFator(resultado.markup)}</strong>
        </p>
      ) : (
        <p className="aviso aviso-erro">{resultado.erro} Nenhum preço é calculado.</p>
      )}
      <p className="suave pequeno">
        Margens sugeridas pela planilha:{' '}
        {(Object.keys(FAIXAS_DE_MARGEM) as Setor[])
          .map(
            (setor) =>
              `${NOME_DO_SETOR[setor]} ${formatarPercentual(FAIXAS_DE_MARGEM[setor].minimo)} a ${formatarPercentual(FAIXAS_DE_MARGEM[setor].maximo)}`,
          )
          .join(' · ')}
        .
      </p>
    </div>
  );
}

export function TabelaProdutos({
  produtos,
  resultado,
  editavel,
}: {
  produtos: ProdutoPreco[];
  resultado: ResultadoMarkup;
  editavel: boolean;
}) {
  if (produtos.length === 0) {
    return <p className="suave">Nenhum produto neste mês.</p>;
  }
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Produto</th>
            <th className="num">Custo total</th>
            <th className="num">Preço sugerido</th>
            <th className="num">Preço trabalhado</th>
            <th className="num">Concorrente</th>
            {editavel && <th />}
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => {
            const custo = custoTotal(produto);
            return (
              <tr key={produto.id}>
                <td style={{ whiteSpace: 'normal' }}>{produto.nome}</td>
                <td className="num">
                  <Reais valor={custo} />
                </td>
                <td className="num">
                  <strong>
                    <Reais valor={precoSugerido(custo, resultado)} />
                  </strong>
                </td>
                <td className="num">
                  <Reais valor={produto.precoTrabalhado} />
                </td>
                <td className="num">
                  <Reais valor={produto.precoConcorrente} />
                </td>
                {editavel && (
                  <td>
                    <Formulario acao={removerProduto} className="linha">
                      <input type="hidden" name="id" value={produto.id} />
                      <BotaoEnviar variante="secundario" confirmar="Remover este produto?">
                        Remover
                      </BotaoEnviar>
                    </Formulario>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FormProduto({ mes }: { mes: Mes }) {
  return (
    <Formulario acao={adicionarProduto}>
      <input type="hidden" name="mes" value={chaveDoMes(mes)} />
      <div className="formulario-linha">
        <Campo rotulo="Produto" nome="nome" maxLength={120} />
        <Campo rotulo="Custo (R$)" nome="custo" inputMode="decimal" placeholder="0,00" />
        <Campo rotulo="Frete (R$)" nome="frete" inputMode="decimal" placeholder="0,00" />
        <Campo rotulo="Embalagem (R$)" nome="embalagem" inputMode="decimal" placeholder="0,00" />
        <Campo
          rotulo="Imposto de entrada (R$)"
          nome="impostoEntrada"
          inputMode="decimal"
          placeholder="0,00"
        />
        <Campo rotulo="Preço trabalhado (R$)" nome="precoTrabalhado" inputMode="decimal" />
        <Campo rotulo="Preço do concorrente (R$)" nome="precoConcorrente" inputMode="decimal" />
      </div>
      <BotaoEnviar>Adicionar produto</BotaoEnviar>
    </Formulario>
  );
}
