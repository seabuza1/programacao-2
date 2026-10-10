import { nomeCurtoDoMes } from '@/lib/datas';
import { formatarReais } from '@/lib/money';
import { formatarPercentual, type Percentual } from '@/lib/percent';
import { BotaoEnviar, Campo, Formulario, Pct, Reais } from '@/lib/ui';
import { salvarAnaliseDoAno } from '../actions';
import type {
  AnaliseMes,
  analiseFaturamento,
  Gerencial,
  LinhaAnual,
  ProLaboreMes,
  RelatorioAnual,
} from '../service';

export function TabelaGerencial({ gerencial }: { gerencial: Gerencial }) {
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Conta</th>
            <th className="num">Valor</th>
            <th className="num">% do faturamento</th>
          </tr>
        </thead>
        <tbody>
          <tr className="total">
            <td>Faturamento</td>
            <td className="num">
              <Reais valor={gerencial.faturamento} />
            </td>
            <td />
          </tr>
          {gerencial.grupos.map((grupo) => [
            <tr key={grupo.grupo} className="total">
              <td>{grupo.nome}</td>
              <td className="num">
                <Reais valor={grupo.total} />
              </td>
              <td className="num">
                <Pct valor={grupo.percentual} />
              </td>
            </tr>,
            ...grupo.contas.map((linha) => (
              <tr key={linha.conta.id}>
                <td style={{ paddingLeft: 24, whiteSpace: 'normal' }}>{linha.conta.nome}</td>
                <td className="num">{linha.total !== 0 && <Reais valor={linha.total} />}</td>
                <td className="num">{linha.total !== 0 && <Pct valor={linha.percentual} />}</td>
              </tr>
            )),
          ])}
        </tbody>
        <tfoot>
          <tr>
            <td>Total de saídas</td>
            <td className="num">
              <Reais valor={gerencial.totalSaidas} />
            </td>
            <td className="num">
              <Pct valor={gerencial.percentualSaidas} />
            </td>
          </tr>
          <tr>
            <td>Lucro</td>
            <td className="num">
              <Reais valor={gerencial.lucro} />
            </td>
            <td className="num">
              <Pct valor={gerencial.percentualLucro} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const MESES = Array.from({ length: 12 }, (_, i) => i + 1);

function LinhaDoAno({
  linha,
  destaque = false,
  recuo = false,
}: {
  linha: LinhaAnual;
  destaque?: boolean;
  recuo?: boolean;
}) {
  return (
    <tr className={destaque ? 'total' : undefined}>
      <td
        className="fixa"
        style={{ paddingLeft: recuo ? 24 : undefined, whiteSpace: 'normal', minWidth: 180 }}
      >
        {linha.nome}
      </td>
      {linha.meses.map((valor, i) => (
        <td key={i} className="num">
          {valor !== 0 && <Reais valor={valor} simbolo={false} />}
        </td>
      ))}
      <td className="num">
        <Reais valor={linha.total} simbolo={false} />
      </td>
      <td className="num">
        <Reais valor={linha.media} simbolo={false} />
      </td>
      <td className="num">
        <Pct valor={linha.percentual} />
      </td>
    </tr>
  );
}

export function TabelaAnual({ anual }: { anual: RelatorioAnual }) {
  return (
    <div className="pilha">
      <p className="suave pequeno">
        Meses lançados: {anual.mesesLancados}. Média = total ÷ meses lançados. % = total da linha ÷
        faturamento do ano.
      </p>
      <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr>
              <th className="fixa">Linha</th>
              {MESES.map((m) => (
                <th key={m} className="num">
                  {nomeCurtoDoMes(m)}
                </th>
              ))}
              <th className="num">Total</th>
              <th className="num">Média</th>
              <th className="num">%</th>
            </tr>
          </thead>
          <tbody>
            {anual.entradas.map((linha) => (
              <LinhaDoAno key={linha.id} linha={linha} recuo />
            ))}
            <LinhaDoAno linha={anual.faturamento} destaque />
            {anual.grupos.map((grupo) => [
              <LinhaDoAno key={grupo.id} linha={grupo} destaque />,
              ...anual.saidas
                .filter((s) => s.grupo === grupo.grupo)
                .map((linha) => <LinhaDoAno key={linha.id} linha={linha} recuo />),
            ])}
            <LinhaDoAno linha={anual.totalSaidas} destaque />
            <LinhaDoAno linha={anual.lucro} destaque />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TabelaProLabore({
  meses,
  ano,
  limite,
}: {
  meses: ProLaboreMes[];
  ano: ProLaboreMes;
  limite: Percentual;
}) {
  return (
    <div className="pilha">
      <p className="suave">
        Orientação da planilha: retirar no mínimo 1 salário mínimo, sem passar de{' '}
        {formatarPercentual(limite)} do faturamento.
      </p>
      <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr>
              <th>Mês</th>
              <th className="num">Retiradas</th>
              <th className="num">Faturamento</th>
              <th className="num">% do faturamento</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {meses.map((mes, i) => (
              <tr key={i}>
                <td>{nomeCurtoDoMes(i + 1)}</td>
                <td className="num">
                  <Reais valor={mes.retiradas} />
                </td>
                <td className="num">
                  <Reais valor={mes.faturamento} />
                </td>
                <td className="num">
                  <Pct valor={mes.percentual} />
                </td>
                <td>
                  {mes.acimaDoLimite && <span className="selo selo-alerta">acima do limite</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Ano</td>
              <td className="num">
                <Reais valor={ano.retiradas} />
              </td>
              <td className="num">
                <Reais valor={ano.faturamento} />
              </td>
              <td className="num">
                <Pct valor={ano.percentual} />
              </td>
              <td>
                {ano.acimaDoLimite && <span className="selo selo-alerta">acima do limite</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

type Analise = ReturnType<typeof analiseFaturamento>;

export function TabelaAnalise({ analise }: { analise: Analise }) {
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Mês</th>
            <th className="num">Ano anterior</th>
            <th className="num">Meta</th>
            <th className="num">Realizado</th>
            <th className="num">Crescimento</th>
          </tr>
        </thead>
        <tbody>
          {analise.meses.map((mes, i) => (
            <tr key={i}>
              <td>{nomeCurtoDoMes(i + 1)}</td>
              <td className="num">
                <Reais valor={mes.anterior} />
              </td>
              <td className="num">
                <Reais valor={mes.meta} />
              </td>
              <td className="num">
                <Reais valor={mes.realizado} />
              </td>
              <td className="num">
                <Pct valor={mes.crescimento} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="num">
              <Reais valor={analise.total.anterior} />
            </td>
            <td className="num">
              <Reais valor={analise.total.meta} />
            </td>
            <td className="num">
              <Reais valor={analise.total.realizado} />
            </td>
            <td className="num">
              <Pct valor={analise.total.crescimento} />
            </td>
          </tr>
          <tr>
            <td>Média (÷ 12)</td>
            <td className="num">
              <Reais valor={analise.media.anterior} />
            </td>
            <td className="num">
              <Reais valor={analise.media.meta} />
            </td>
            <td className="num">
              <Reais valor={analise.media.realizado} />
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function FormAnalise({
  ano,
  anterior,
  crescimento,
}: {
  ano: number;
  anterior: AnaliseMes['anterior'][];
  crescimento: Percentual;
}) {
  return (
    <Formulario acao={salvarAnaliseDoAno}>
      <input type="hidden" name="ano" value={String(ano)} />
      <Campo
        rotulo={`Crescimento desejado para ${ano} (%)`}
        nome="crescimento"
        inputMode="decimal"
        defaultValue={formatarPercentual(crescimento)}
      />
      <p className="suave pequeno">Faturamento de {ano - 1}, mês a mês (R$):</p>
      <div className="formulario-linha">
        {anterior.map((valor, i) => (
          <Campo
            key={i}
            rotulo={nomeCurtoDoMes(i + 1)}
            nome={`anterior${i + 1}`}
            inputMode="decimal"
            defaultValue={formatarReais(valor, { simbolo: false })}
          />
        ))}
      </div>
      <BotaoEnviar>Salvar análise</BotaoEnviar>
    </Formulario>
  );
}
