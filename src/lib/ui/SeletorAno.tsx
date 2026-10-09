import Link from 'next/link';

/** Navegação de ano pela URL (?ano=AAAA), preservando os outros parâmetros. */
export function SeletorAno({
  ano,
  caminho,
  parametros = {},
}: {
  ano: number;
  caminho: string;
  parametros?: Record<string, string>;
}) {
  const href = (a: number) =>
    `${caminho}?${new URLSearchParams({ ...parametros, ano: String(a) }).toString()}`;
  return (
    <nav className="linha" aria-label="Ano">
      <Link className="botao botao-secundario" href={href(ano - 1)} aria-label="Ano anterior">
        ‹
      </Link>
      <strong style={{ minWidth: 60, textAlign: 'center' }}>{ano}</strong>
      <Link className="botao botao-secundario" href={href(ano + 1)} aria-label="Próximo ano">
        ›
      </Link>
    </nav>
  );
}
