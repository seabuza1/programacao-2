import { chaveDoMes, type Mes } from '@/lib/datas';
import { formatarReais, ZERO } from '@/lib/money';
import { formatarPercentual } from '@/lib/percent';
import { BotaoEnviar, Campo, Formulario } from '@/lib/ui';
import { salvarParametrosDoMes, salvarSaldos } from '../actions';
import type { ParametrosMes, SaldosIniciais } from '../service';

export function FormParametros({
  mes,
  parametros,
  bloqueado,
}: {
  mes: Mes;
  parametros: ParametrosMes;
  bloqueado: boolean;
}) {
  return (
    <Formulario acao={salvarParametrosDoMes}>
      <input type="hidden" name="mes" value={chaveDoMes(mes)} />
      <fieldset
        disabled={bloqueado}
        className="formulario-linha"
        style={{ border: 0, padding: 0, margin: 0 }}
      >
        <Campo
          rotulo="Dias previstos de venda"
          nome="diasPrevistos"
          inputMode="numeric"
          defaultValue={String(parametros.diasPrevistos)}
        />
        <Campo
          rotulo="Meta de faturamento (R$)"
          nome="meta"
          inputMode="decimal"
          defaultValue={formatarReais(parametros.meta, { simbolo: false })}
        />
        <Campo
          rotulo="Taxa do débito (%)"
          nome="taxaDebito"
          inputMode="decimal"
          defaultValue={formatarPercentual(parametros.taxaDebito)}
        />
        <Campo
          rotulo="Taxa do crédito (%)"
          nome="taxaCredito"
          inputMode="decimal"
          defaultValue={formatarPercentual(parametros.taxaCredito)}
        />
      </fieldset>
      {!bloqueado && <BotaoEnviar>Salvar parâmetros</BotaoEnviar>}
    </Formulario>
  );
}

export function FormSaldosIniciais({
  saldos,
  mesPadrao,
  bloqueado,
}: {
  saldos: SaldosIniciais | null;
  mesPadrao: Mes;
  bloqueado: boolean;
}) {
  return (
    <Formulario acao={salvarSaldos}>
      <fieldset
        disabled={bloqueado}
        className="formulario-linha"
        style={{ border: 0, padding: 0, margin: 0 }}
      >
        <Campo
          rotulo="Mês de início"
          nome="mesInicio"
          type="month"
          defaultValue={chaveDoMes(saldos?.mesInicio ?? mesPadrao)}
        />
        <Campo
          rotulo="Saldo em dinheiro (R$)"
          nome="dinheiro"
          inputMode="decimal"
          defaultValue={formatarReais(saldos?.dinheiro ?? ZERO, { simbolo: false })}
        />
        <Campo
          rotulo="Saldo no banco (R$)"
          nome="banco"
          inputMode="decimal"
          defaultValue={formatarReais(saldos?.banco ?? ZERO, { simbolo: false })}
        />
      </fieldset>
      {!bloqueado && <BotaoEnviar>Salvar saldos iniciais</BotaoEnviar>}
    </Formulario>
  );
}
