import { BotaoEnviar, Campo, Formulario, Selecao } from '@/lib/ui';
import { ativarItem, criarConta, criarForma, renomearItem } from '../actions';
import {
  DESTINOS,
  GRUPOS,
  NOME_DO_DESTINO,
  NOME_DO_GRUPO,
  ordenarContas,
  ordenarFormas,
  podeRenomear,
  type Conta,
  type Forma,
} from '../service';

type Tipo = 'forma' | 'conta';

function Situacao({ ativa }: { ativa: boolean }) {
  return ativa ? (
    <span className="selo selo-ok">ativa</span>
  ) : (
    <span className="selo">inativa</span>
  );
}

function AlternarAtiva({ tipo, id, ativa }: { tipo: Tipo; id: string; ativa: boolean }) {
  return (
    <Formulario acao={ativarItem} className="linha">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ativa" value={String(!ativa)} />
      <BotaoEnviar variante="secundario">{ativa ? 'Desativar' : 'Ativar'}</BotaoEnviar>
    </Formulario>
  );
}

function Nome({ tipo, item }: { tipo: Tipo; item: { id: string; nome: string; padrao: boolean } }) {
  if (!podeRenomear(item)) {
    return (
      <>
        {item.nome} <span className="selo">padrão</span>
      </>
    );
  }
  return (
    <details>
      <summary>{item.nome}</summary>
      <Formulario acao={renomearItem}>
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="id" value={item.id} />
        <Campo rotulo="Novo nome" nome="nome" id={`nome-${item.id}`} defaultValue={item.nome} />
        <BotaoEnviar variante="secundario">Renomear</BotaoEnviar>
      </Formulario>
    </details>
  );
}

export function ListaFormas({ formas }: { formas: Forma[] }) {
  return (
    <div className="pilha">
      <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr>
              <th>Forma</th>
              <th>Para onde vai</th>
              <th>Faturamento</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordenarFormas(formas).map((forma) => (
              <tr key={forma.id}>
                <td>
                  <Nome tipo="forma" item={forma} />
                </td>
                <td>{NOME_DO_DESTINO[forma.destino]}</td>
                <td>{forma.contaFaturamento ? 'Conta' : 'Não conta'}</td>
                <td>
                  <Situacao ativa={forma.ativa} />
                </td>
                <td>
                  <AlternarAtiva tipo="forma" id={forma.id} ativa={forma.ativa} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>Nova forma de recebimento</summary>
        <Formulario acao={criarForma}>
          <Campo rotulo="Nome" nome="nome" id="nova-forma-nome" maxLength={60} />
          <Selecao
            rotulo="Para onde vai o dinheiro"
            nome="destino"
            id="nova-forma-destino"
            defaultValue="banco"
            opcoes={DESTINOS.map((d) => ({ valor: d, nome: NOME_DO_DESTINO[d] }))}
          />
          <label className="linha">
            <input type="checkbox" name="contaFaturamento" defaultChecked /> Conta no faturamento
          </label>
          <BotaoEnviar>Criar forma</BotaoEnviar>
        </Formulario>
      </details>
    </div>
  );
}

export function ListaContas({ contas }: { contas: Conta[] }) {
  const ordenadas = ordenarContas(contas);
  return (
    <div className="pilha">
      {GRUPOS.map((grupo) => (
        <div key={grupo} className="rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>{NOME_DO_GRUPO[grupo]}</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ordenadas
                .filter((conta) => conta.grupo === grupo)
                .map((conta) => (
                  <tr key={conta.id}>
                    <td style={{ whiteSpace: 'normal' }}>
                      <Nome tipo="conta" item={conta} />
                    </td>
                    <td>
                      <Situacao ativa={conta.ativa} />
                    </td>
                    <td>
                      <AlternarAtiva tipo="conta" id={conta.id} ativa={conta.ativa} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
      <details>
        <summary>Nova conta</summary>
        <Formulario acao={criarConta}>
          <Campo rotulo="Nome" nome="nome" id="nova-conta-nome" maxLength={80} />
          <Selecao
            rotulo="Grupo"
            nome="grupo"
            id="nova-conta-grupo"
            defaultValue="fixo"
            opcoes={GRUPOS.map((g) => ({ valor: g, nome: NOME_DO_GRUPO[g] }))}
          />
          <BotaoEnviar>Criar conta</BotaoEnviar>
        </Formulario>
      </details>
    </div>
  );
}
