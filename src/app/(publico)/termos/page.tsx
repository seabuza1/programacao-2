import type { Metadata } from 'next';
import Link from 'next/link';
import { AvisoRascunho } from '@/app/_componentes/Rascunho';

export const metadata: Metadata = { title: 'Termos de uso' };

export default function Termos() {
  return (
    <article className="pilha">
      <h1>Termos de uso</h1>
      <AvisoRascunho />
      <h2>1. Quem somos</h2>
      <p>
        O Gestão Fácil é um sistema de livro caixa oferecido por [razão social da Gestão Fácil],
        CNPJ [preencher], com sede em [endereço] (“Gestão Fácil”), às empresas atendidas pela
        consultoria.
      </p>
      <h2>2. Acesso</h2>
      <p>
        O acesso é feito só por convite. Cada pessoa tem login próprio, pessoal e intransferível.
        Administradores e donos usam segundo fator (aplicativo autenticador). A empresa é
        responsável por quem ela pede para convidar e por avisar quando alguém deve perder o acesso.
      </p>
      <h2>3. Uso permitido</h2>
      <p>
        O sistema serve para registrar entradas e saídas da própria empresa e acompanhar seus
        relatórios. Não é permitido tentar acessar dados de outras empresas, contornar controles de
        segurança ou usar o sistema para fins ilícitos.
      </p>
      <h2>4. Dados lançados</h2>
      <p>
        Os dados financeiros lançados pertencem à empresa. A Gestão Fácil os trata para prestar o
        serviço e a consultoria, conforme a <Link href="/privacidade">política de privacidade</Link>
        . A empresa pode pedir a exportação completa ou a exclusão dos seus dados.
      </p>
      <h2>5. Responsabilidades</h2>
      <p>
        Os cálculos seguem as regras combinadas com a consultoria. A empresa responde pela exatidão
        do que lança. [Limitação de responsabilidade, disponibilidade e suporte: preencher.]
      </p>
      <h2>6. Encerramento</h2>
      <p>[Prazo de aviso, exportação dos dados e exclusão ao fim do contrato: preencher.]</p>
      <h2>7. Foro e contato</h2>
      <p>Contato: [e-mail]. Foro: [comarca].</p>
      <p className="suave pequeno">Versão: rascunho de outubro de 2026.</p>
    </article>
  );
}
