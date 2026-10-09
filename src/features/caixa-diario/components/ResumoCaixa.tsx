import type { Forma } from '@/features/cadastros';
import type { Centavos } from '@/lib/money';
import { Indicador, Pct, Reais } from '@/lib/ui';
import type { ResumoCaixaDiario } from '../service';

export function IndicadoresDoMes({ resumo, meta }: { resumo: ResumoCaixaDiario; meta: Centavos }) {
  return (
    <div className="grade">
      <Indicador rotulo="Faturamento do mês">
        <Reais valor={resumo.faturamento} />
      </Indicador>
      <Indicador
        rotulo="Previsão de fechamento"
        detalhe={
          meta > 0 ? (
            <>
              Meta <Reais valor={meta} />
              {resumo.previsaoAbaixoDaMeta && (
                <>
                  {' '}
                  · <span className="selo selo-alerta">abaixo da meta</span>
                </>
              )}
            </>
          ) : (
            'Sem meta cadastrada'
          )
        }
      >
        <Reais valor={resumo.previsao} />
      </Indicador>
      <Indicador rotulo="Dias lançados">{resumo.diasLancados}</Indicador>
      <Indicador rotulo="Média necessária por dia">
        <Reais valor={resumo.mediaNecessaria} />
      </Indicador>
      <Indicador rotulo="Média realizada por dia">
        <Reais valor={resumo.mediaRealizada} />
      </Indicador>
      <Indicador rotulo="Ticket médio" detalhe={`${resumo.qtdVendas} vendas no mês`}>
        <Reais valor={resumo.ticketMedio} />
      </Indicador>
    </div>
  );
}

export function ParticipacaoPorForma({
  formas,
  resumo,
}: {
  formas: Forma[];
  resumo: ResumoCaixaDiario;
}) {
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Forma</th>
            <th className="num">Total</th>
            <th className="num">Participação</th>
          </tr>
        </thead>
        <tbody>
          {formas.map((forma) => (
            <tr key={forma.id}>
              <td>
                {forma.nome}
                {!forma.contaFaturamento && <span className="suave"> (não conta)</span>}
              </td>
              <td className="num">
                <Reais valor={resumo.totalPorForma[forma.id] ?? null} />
              </td>
              <td className="num">
                <Pct valor={resumo.participacao[forma.id] ?? null} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Faturamento</td>
            <td className="num">
              <Reais valor={resumo.faturamento} />
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
