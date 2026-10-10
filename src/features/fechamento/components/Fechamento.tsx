import { chaveDoMes, type Mes } from '@/lib/datas';
import { BotaoEnviar, Formulario } from '@/lib/ui';
import { alterarFechamento } from '../actions';

/** Selo e botão de fechar/reabrir. O botão só aparece para quem pode. */
export function Fechamento({
  mes,
  fechado,
  podeAlterar,
}: {
  mes: Mes;
  fechado: boolean;
  podeAlterar: boolean;
}) {
  return (
    <div className="linha">
      {fechado ? (
        <span className="selo selo-alerta">Mês fechado</span>
      ) : (
        <span className="selo">Mês aberto</span>
      )}
      {podeAlterar && (
        <Formulario acao={alterarFechamento} className="linha">
          <input type="hidden" name="mes" value={chaveDoMes(mes)} />
          <input type="hidden" name="operacao" value={fechado ? 'reabrir' : 'fechar'} />
          <BotaoEnviar
            variante="secundario"
            confirmar={
              fechado
                ? 'Reabrir o mês libera alterações nos lançamentos. Continuar?'
                : 'Depois de fechado, ninguém altera os lançamentos do mês até ele ser reaberto. Fechar?'
            }
          >
            {fechado ? 'Reabrir mês' : 'Fechar mês'}
          </BotaoEnviar>
        </Formulario>
      )}
    </div>
  );
}

/** Aviso para telas de lançamento. */
export function AvisoMesFechado({ fechado }: { fechado: boolean }) {
  return fechado ? (
    <p className="aviso aviso-alerta">
      Este mês está fechado. Reabra o mês para alterar os lançamentos.
    </p>
  ) : null;
}
