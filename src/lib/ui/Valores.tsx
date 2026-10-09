import type { ReactNode } from 'react';
import { formatarReais, type Centavos } from '@/lib/money';
import { formatarPercentual, type Percentual } from '@/lib/percent';

/** Valor em reais; negativo em vermelho; null vira "—". */
export function Reais({ valor, simbolo = true }: { valor: Centavos | null; simbolo?: boolean }) {
  if (valor === null) {
    return <span className="suave">—</span>;
  }
  return (
    <span className={valor < 0 ? 'negativo' : undefined}>{formatarReais(valor, { simbolo })}</span>
  );
}

export function Pct({ valor }: { valor: Percentual | null }) {
  return (
    <span className={valor !== null && valor < 0 ? 'negativo' : undefined}>
      {formatarPercentual(valor)}
    </span>
  );
}

export function Indicador({
  rotulo,
  children,
  detalhe,
}: {
  rotulo: string;
  children: ReactNode;
  detalhe?: ReactNode;
}) {
  return (
    <div className="cartao indicador">
      <span className="rotulo">{rotulo}</span>
      <span className="valor">{children}</span>
      {detalhe && <span className="suave pequeno">{detalhe}</span>}
    </div>
  );
}
