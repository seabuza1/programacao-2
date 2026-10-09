import { BotaoEnviar, Formulario } from '@/lib/ui';
import { criarAnotacao } from '../actions';
import type { Anotacao } from '../repository';

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
});

export function ListaAnotacoes({
  anotacoes,
  mostrarVisibilidade,
}: {
  anotacoes: Anotacao[];
  mostrarVisibilidade: boolean;
}) {
  if (anotacoes.length === 0) {
    return <p className="suave">Nenhuma anotação.</p>;
  }
  return (
    <ul className="pilha" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {anotacoes.map((a) => (
        <li key={a.id} className="cartao" style={{ padding: 14 }}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{a.texto}</p>
          <span className="suave pequeno">
            {a.autor} · {formatoData.format(new Date(a.criadaEm))}
          </span>
          {mostrarVisibilidade && (
            <>
              {' '}
              {a.visivelParaEmpresa ? (
                <span className="selo selo-ok">visível para a empresa</span>
              ) : (
                <span className="selo">só a consultoria</span>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export function FormAnotacao({ empresaId }: { empresaId: string }) {
  return (
    <Formulario acao={criarAnotacao}>
      <input type="hidden" name="empresaId" value={empresaId} />
      <div className="campo">
        <label htmlFor="texto">Nova anotação</label>
        <textarea id="texto" name="texto" maxLength={4000} required />
      </div>
      <label className="linha">
        <input type="checkbox" name="visivelParaEmpresa" /> Visível para a empresa
      </label>
      <p className="suave pequeno">
        Anotações não são editadas nem apagadas depois de registradas.
      </p>
      <BotaoEnviar>Registrar anotação</BotaoEnviar>
    </Formulario>
  );
}
