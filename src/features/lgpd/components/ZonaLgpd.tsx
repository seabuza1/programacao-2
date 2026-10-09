import { BotaoEnviar, Campo, Formulario } from '@/lib/ui';
import { excluirEmpresaDefinitivamente } from '../actions';

export function ZonaLgpd({ empresa }: { empresa: { id: string; nome: string } }) {
  return (
    <div className="pilha">
      <div className="pilha">
        <h3>Exportar todos os dados</h3>
        <p className="suave">
          Arquivo JSON com tudo da empresa: cadastros, lançamentos (inclusive os excluídos),
          parâmetros, anotações, auditoria e os usuários com acesso.
        </p>
        <a className="botao botao-secundario" href={`/admin/empresas/${empresa.id}/dados`} download>
          Baixar dados da empresa
        </a>
      </div>
      <div className="pilha">
        <h3>Excluir a empresa</h3>
        <p className="aviso aviso-erro">
          Apaga a empresa e todos os dados dela, inclusive a auditoria. Contas de usuários que só
          tinham acesso a esta empresa também são apagadas. Não dá para desfazer. Baixe os dados
          antes.
        </p>
        <Formulario acao={excluirEmpresaDefinitivamente}>
          <input type="hidden" name="empresaId" value={empresa.id} />
          <Campo
            rotulo={`Para confirmar, digite: ${empresa.nome}`}
            nome="confirmacao"
            autoComplete="off"
          />
          <BotaoEnviar
            variante="perigo"
            confirmar={`Excluir "${empresa.nome}" e todos os dados dela? Não dá para desfazer.`}
          >
            Excluir empresa e dados
          </BotaoEnviar>
        </Formulario>
      </div>
    </div>
  );
}
