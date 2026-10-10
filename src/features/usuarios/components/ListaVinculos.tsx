import { BotaoEnviar, Formulario } from '@/lib/ui';
import { mudarPapel, removerAcesso } from '../actions';
import type { VinculoDaEmpresa } from '../repository';
import { ehUnicaAdmin } from '../service';

interface Props {
  vinculos: VinculoDaEmpresa[];
  papeis: { valor: string; nome: string }[];
  editavel: boolean;
}

export function ListaVinculos({ vinculos, papeis, editavel }: Props) {
  if (vinculos.length === 0) {
    return <p className="suave">Nenhum usuário.</p>;
  }
  const nomeDoPapel = new Map(papeis.map((p) => [p.valor, p.nome]));
  return (
    <div className="rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Papel</th>
            {editavel && <th />}
          </tr>
        </thead>
        <tbody>
          {vinculos.map((v) => {
            const unica = ehUnicaAdmin(vinculos, v.id);
            return (
              <tr key={v.id}>
                <td style={{ whiteSpace: 'normal' }}>
                  {v.nome && <div>{v.nome}</div>}
                  <div className="suave pequeno">{v.email}</div>
                </td>
                <td>
                  {editavel && !unica ? (
                    <Formulario acao={mudarPapel} className="linha">
                      <input type="hidden" name="vinculoId" value={v.id} />
                      <select
                        name="papel"
                        defaultValue={v.papel}
                        aria-label={`Papel de ${v.email}`}
                        style={{ width: 'auto' }}
                      >
                        {papeis.map((p) => (
                          <option key={p.valor} value={p.valor}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                      <BotaoEnviar variante="secundario">Trocar</BotaoEnviar>
                    </Formulario>
                  ) : (
                    nomeDoPapel.get(v.papel)
                  )}
                </td>
                {editavel && (
                  <td>
                    {!unica && (
                      <Formulario acao={removerAcesso} className="linha">
                        <input type="hidden" name="vinculoId" value={v.id} />
                        <BotaoEnviar
                          variante="secundario"
                          confirmar={`Remover o acesso de ${v.email} a esta empresa?`}
                        >
                          Remover acesso
                        </BotaoEnviar>
                      </Formulario>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
