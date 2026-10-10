import { sair } from '@/features/autenticacao';

export function BotaoSair() {
  return (
    <form action={sair}>
      <button type="submit" className="botao-link">
        Sair
      </button>
    </form>
  );
}
