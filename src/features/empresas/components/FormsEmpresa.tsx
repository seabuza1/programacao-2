import { NOME_DO_SETOR, type Setor } from '@/features/precificacao';
import { BotaoEnviar, Campo, Formulario, Selecao } from '@/lib/ui';
import { editarEmpresa, novaEmpresa } from '../actions';
import type { Empresa } from '../repository';

const OPCOES_SETOR = [
  { valor: '', nome: 'Não informado' },
  ...(Object.keys(NOME_DO_SETOR) as Setor[]).map((s) => ({ valor: s, nome: NOME_DO_SETOR[s] })),
];

export function FormNovaEmpresa() {
  return (
    <Formulario acao={novaEmpresa}>
      <div className="formulario-linha">
        <Campo rotulo="Nome da empresa" nome="nome" id="nova-empresa-nome" maxLength={120} />
        <Selecao
          rotulo="Setor"
          nome="setor"
          id="nova-empresa-setor"
          defaultValue=""
          opcoes={OPCOES_SETOR}
        />
      </div>
      <p className="suave pequeno">
        A empresa nasce com as formas de recebimento e o plano de contas padrão, e você como
        administradora.
      </p>
      <BotaoEnviar>Criar empresa</BotaoEnviar>
    </Formulario>
  );
}

export function FormEmpresa({ empresa }: { empresa: Empresa }) {
  return (
    <Formulario acao={editarEmpresa}>
      <input type="hidden" name="id" value={empresa.id} />
      <div className="formulario-linha">
        <Campo rotulo="Nome" nome="nome" defaultValue={empresa.nome} maxLength={120} />
        <Selecao
          rotulo="Setor"
          nome="setor"
          defaultValue={empresa.setor ?? ''}
          opcoes={OPCOES_SETOR}
        />
      </div>
      <p className="suave pequeno">O setor define a faixa de margem usada no alerta do painel.</p>
      <BotaoEnviar variante="secundario">Salvar</BotaoEnviar>
    </Formulario>
  );
}
