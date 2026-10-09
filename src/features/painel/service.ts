import { previsaoDeFechamento } from '@/features/caixa-diario';
import { margemForaDaFaixa, type Setor } from '@/features/precificacao';
import { diasEntre } from '@/lib/datas';
import { somar, subtrair, type Centavos } from '@/lib/money';
import { razao, type Percentual } from '@/lib/percent';
import type { Limiares } from './config';

/** Somas devolvidas por painel_empresas (uma linha por empresa). */
export interface LinhaBruta {
  empresaId: string;
  nome: string;
  setor: Setor | null;
  saldoInicialDinheiro: Centavos;
  saldoInicialBanco: Centavos;
  entradasDinheiro: Centavos;
  entradasBanco: Centavos;
  taxasCartao: Centavos;
  movimentoDinheiro: Centavos;
  movimentoBanco: Centavos;
  faturamentoMes: Centavos;
  saidasMes: Centavos;
  taxasCartaoMes: Centavos;
  proLaboreMes: Centavos;
  diasLancadosMes: number;
  diasPrevistos: number;
  meta: Centavos;
  ultimoLancamento: string | null;
  margemLucro: Percentual | null;
}

export interface LinhaPainel {
  empresaId: string;
  nome: string;
  setor: Setor | null;
  saldoDinheiro: Centavos;
  saldoBanco: Centavos;
  faturamento: Centavos;
  lucro: Centavos;
  previsao: Centavos | null;
  meta: Centavos;
  proLabore: Centavos;
  percentualProLabore: Percentual | null;
  margemLucro: Percentual | null;
  ultimoLancamento: string | null;
}

/** Mesmas regras do livro: saldo = inicial + entradas − taxas de cartão + movimentações. */
export function consolidarLinha(b: LinhaBruta): LinhaPainel {
  return {
    empresaId: b.empresaId,
    nome: b.nome,
    setor: b.setor,
    saldoDinheiro: somar(b.saldoInicialDinheiro, b.entradasDinheiro, b.movimentoDinheiro),
    saldoBanco: subtrair(
      somar(b.saldoInicialBanco, b.entradasBanco, b.movimentoBanco),
      b.taxasCartao,
    ),
    faturamento: b.faturamentoMes,
    // Lucro = faturamento − saídas do mês − taxas de cartão (que entram em despesas financeiras).
    lucro: subtrair(b.faturamentoMes, somar(b.saidasMes, b.taxasCartaoMes)),
    previsao: previsaoDeFechamento(b.faturamentoMes, b.diasPrevistos, b.diasLancadosMes),
    meta: b.meta,
    proLabore: b.proLaboreMes,
    percentualProLabore: razao(b.proLaboreMes, b.faturamentoMes),
    margemLucro: b.margemLucro,
    ultimoLancamento: b.ultimoLancamento,
  };
}

export type TipoAlerta =
  | 'previsao_abaixo_meta'
  | 'lucro_negativo'
  | 'pro_labore_alto'
  | 'saldo_negativo'
  | 'margem_fora_faixa'
  | 'sem_lancar';

export interface Alerta {
  tipo: TipoAlerta;
  mensagem: string;
}

/** Alertas da seção 6 do domínio. `hoje` vem de fora para a função não ler o relógio. */
export function alertasDaEmpresa(linha: LinhaPainel, hoje: string, limiares: Limiares): Alerta[] {
  const alertas: Alerta[] = [];
  if (linha.previsao !== null && linha.meta > 0 && linha.previsao < linha.meta) {
    alertas.push({ tipo: 'previsao_abaixo_meta', mensagem: 'Previsão abaixo da meta' });
  }
  if (linha.lucro < 0) {
    alertas.push({ tipo: 'lucro_negativo', mensagem: 'Lucro do mês negativo' });
  }
  if (
    linha.proLabore > 0 &&
    (linha.percentualProLabore === null || linha.percentualProLabore > limiares.proLaboreMaximo)
  ) {
    alertas.push({
      tipo: 'pro_labore_alto',
      mensagem: `Pró-labore acima de ${limiares.proLaboreMaximo / 100}% do faturamento`,
    });
  }
  const negativos = [
    linha.saldoDinheiro < 0 ? 'dinheiro' : null,
    linha.saldoBanco < 0 ? 'banco' : null,
  ].filter(Boolean);
  if (negativos.length > 0) {
    alertas.push({ tipo: 'saldo_negativo', mensagem: `Saldo negativo (${negativos.join(' e ')})` });
  }
  if (
    linha.setor &&
    linha.margemLucro !== null &&
    margemForaDaFaixa(linha.margemLucro, linha.setor)
  ) {
    alertas.push({ tipo: 'margem_fora_faixa', mensagem: 'Margem de lucro fora da faixa do setor' });
  }
  if (!linha.ultimoLancamento) {
    alertas.push({ tipo: 'sem_lancar', mensagem: 'Nenhum lançamento' });
  } else {
    const dias = diasEntre(linha.ultimoLancamento, hoje);
    if (dias > limiares.diasSemLancar) {
      alertas.push({ tipo: 'sem_lancar', mensagem: `Sem lançar há ${dias} dias` });
    }
  }
  return alertas;
}
