import Link from 'next/link';

export default function NaoEncontrada() {
  return (
    <main className="publico">
      <div className="cartao pilha">
        <span className="marca">Gestão Fácil</span>
        <h1>Página não encontrada</h1>
        <p>O endereço não existe ou você não tem acesso a ele.</p>
        <Link href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
