import { formatarData } from '@/lib/datas';
import { BotaoEnviar, Formulario, Reais } from '@/lib/ui';
import { removerMovimentacao } from '../actions';
import type { LivroDoMes } from '../service';

export function TabelaLivro({ livro, editavel }: { livro: LivroDoMes; editavel: boolean }) {
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th className="num">Dinheiro</th>
            <th className="num">Banco</th>
            <th className="num">Saldo dinheiro</th>
            <th className="num">Saldo banco</th>
            {editavel && <th />}
          </tr>
        </thead>
        <tbody>
          <tr className="total">
            <td colSpan={4}>Saldo inicial</td>
            <td className="num">
              <Reais valor={livro.saldoInicial.dinheiro} />
            </td>
            <td className="num">
              <Reais valor={livro.saldoInicial.banco} />
            </td>
            {editavel && <td />}
          </tr>
          {livro.linhas.map((linha, i) => (
            <tr key={`${linha.data}-${i}`}>
              <td>{formatarData(linha.data)}</td>
              <td style={{ whiteSpace: 'normal', minWidth: 200 }}>
                {linha.descricao}
                {linha.tipo !== 'movimentacao' && <span className="selo">automático</span>}
              </td>
              <td className="num">{linha.dinheiro !== 0 && <Reais valor={linha.dinheiro} />}</td>
              <td className="num">{linha.banco !== 0 && <Reais valor={linha.banco} />}</td>
              <td className="num">
                <Reais valor={linha.saldoDinheiro} />
              </td>
              <td className="num">
                <Reais valor={linha.saldoBanco} />
              </td>
              {editavel && (
                <td>
                  {linha.movimentacaoId && (
                    <Formulario acao={removerMovimentacao} className="linha">
                      <input type="hidden" name="id" value={linha.movimentacaoId} />
                      <BotaoEnviar variante="secundario" confirmar="Excluir este lançamento?">
                        Excluir
                      </BotaoEnviar>
                    </Formulario>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>Saldo final</td>
            <td className="num">
              <Reais valor={livro.saldoFinal.dinheiro} />
            </td>
            <td className="num">
              <Reais valor={livro.saldoFinal.banco} />
            </td>
            {editavel && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
