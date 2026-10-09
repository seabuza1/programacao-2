import Link from 'next/link';
import { formatarData } from '@/lib/datas';
import { Reais } from '@/lib/ui';
import type { Alerta, LinhaPainel } from '../service';

export function SelosDeAlerta({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return <span className="selo selo-ok">sem alertas</span>;
  }
  return (
    <span className="linha" style={{ gap: 4 }}>
      {alertas.map((a) => (
        <span
          key={a.tipo}
          className={`selo ${a.tipo === 'saldo_negativo' || a.tipo === 'lucro_negativo' ? 'selo-perigo' : 'selo-alerta'}`}
        >
          {a.mensagem}
        </span>
      ))}
    </span>
  );
}

export function TabelaPainel({ linhas }: { linhas: { linha: LinhaPainel; alertas: Alerta[] }[] }) {
  if (linhas.length === 0) {
    return <p className="suave">Nenhuma empresa. Crie a primeira em Empresas.</p>;
  }
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th className="fixa">Empresa</th>
            <th className="num">Faturamento</th>
            <th className="num">Previsão / meta</th>
            <th className="num">Lucro</th>
            <th className="num">Dinheiro</th>
            <th className="num">Banco</th>
            <th>Último lançamento</th>
            <th>Alertas</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ linha, alertas }) => (
            <tr key={linha.empresaId}>
              <th className="fixa" scope="row" style={{ whiteSpace: 'normal', minWidth: 140 }}>
                <Link href={`/admin/empresas/${linha.empresaId}`}>{linha.nome}</Link>
              </th>
              <td className="num">
                <Reais valor={linha.faturamento} />
              </td>
              <td className="num">
                <Reais valor={linha.previsao} />
                <div className="suave pequeno">
                  {linha.meta > 0 ? <Reais valor={linha.meta} /> : 'sem meta'}
                </div>
              </td>
              <td className="num">
                <Reais valor={linha.lucro} />
              </td>
              <td className="num">
                <Reais valor={linha.saldoDinheiro} />
              </td>
              <td className="num">
                <Reais valor={linha.saldoBanco} />
              </td>
              <td>{linha.ultimoLancamento ? formatarData(linha.ultimoLancamento) : '—'}</td>
              <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                <SelosDeAlerta alertas={alertas} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
