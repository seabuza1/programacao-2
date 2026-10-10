import type { Resultado } from '@/lib/erros';

export function Aviso({ resultado }: { resultado: Resultado }) {
  if (!resultado.ok) {
    return (
      <p role="alert" className="aviso aviso-erro">
        {resultado.erro}
      </p>
    );
  }
  if (resultado.mensagem) {
    return (
      <p role="status" className="aviso aviso-ok">
        {resultado.mensagem}
      </p>
    );
  }
  return null;
}
