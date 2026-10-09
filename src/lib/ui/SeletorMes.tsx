import Link from 'next/link';
import { chaveDoMes, mesAnterior, nomeDoMes, proximoMes, type Mes } from '@/lib/datas';

/** Navegação de mês pela URL (?mes=AAAA-MM), preservando os outros parâmetros. */
export function SeletorMes({
  mes,
  caminho,
  parametros = {},
}: {
  mes: Mes;
  caminho: string;
  parametros?: Record<string, string>;
}) {
  const href = (m: Mes) =>
    `${caminho}?${new URLSearchParams({ ...parametros, mes: chaveDoMes(m) }).toString()}`;
  return (
    <nav className="linha" aria-label="Mês">
      <Link
        className="botao botao-secundario"
        href={href(mesAnterior(mes))}
        aria-label="Mês anterior"
      >
        ‹
      </Link>
      <strong style={{ minWidth: 170, textAlign: 'center' }}>{nomeDoMes(mes)}</strong>
      <Link
        className="botao botao-secundario"
        href={href(proximoMes(mes))}
        aria-label="Próximo mês"
      >
        ›
      </Link>
    </nav>
  );
}
