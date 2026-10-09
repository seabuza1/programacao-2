import type { Metadata } from 'next';
import { AvisoRascunho } from '@/app/_componentes/Rascunho';

export const metadata: Metadata = { title: 'Política de privacidade' };

export default function Privacidade() {
  return (
    <article className="pilha">
      <h1>Política de privacidade</h1>
      <AvisoRascunho />
      <h2>1. Controlador e encarregado</h2>
      <p>
        [Definir com o advogado o papel de cada parte: a Gestão Fácil como controladora dos dados de
        login e operadora dos dados financeiros lançados por cada empresa, ou outro arranjo.]
        Encarregado (DPO): [nome e e-mail].
      </p>
      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li>Dados de quem usa: nome, e-mail, papel em cada empresa e registros de acesso.</li>
        <li>
          Dados da empresa: lançamentos de caixa, saídas, parâmetros, preços, anotações da
          consultoria e o histórico de alterações (auditoria).
        </li>
      </ul>
      <p>Não tratamos dados de cartão nem dados sensíveis. O sistema não recebe arquivos.</p>
      <h2>3. Para que usamos</h2>
      <p>
        Para prestar o serviço de livro caixa, gerar relatórios, apoiar a consultoria e manter a
        segurança (login, segundo fator, limites de tentativas). Base legal: execução de contrato e
        legítimo interesse em segurança. [Confirmar com o advogado.]
      </p>
      <h2>4. Com quem compartilhamos</h2>
      <p>
        Com fornecedores que hospedam o sistema: Supabase (banco de dados e login, região São Paulo)
        e Vercel (aplicação). Opcionalmente, Cloudflare (verificação contra robôs no login). Não
        vendemos dados. [Listar contratos e transferências internacionais.]
      </p>
      <h2>5. Segurança</h2>
      <p>
        Acesso só por vínculo explícito com a empresa, isolamento entre empresas no banco de dados,
        segundo fator para administradores e donos, conexão sempre criptografada e cópias de
        segurança.
      </p>
      <h2>6. Por quanto tempo guardamos</h2>
      <p>[Prazo de guarda durante e após o contrato e obrigações legais: preencher.]</p>
      <h2>7. Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, portabilidade (exportação completa em arquivo) e exclusão
        dos dados, pelo contato abaixo. A exclusão de uma empresa apaga todos os dados dela e as
        contas de quem só tinha acesso a ela.
      </p>
      <h2>8. Contato</h2>
      <p>[e-mail do encarregado]</p>
      <p className="suave pequeno">Versão: rascunho de outubro de 2026.</p>
    </article>
  );
}
