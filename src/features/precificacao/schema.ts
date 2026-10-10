import { z } from 'zod';
import {
  campoId,
  campoMes,
  campoPercentual,
  campoReais,
  campoReaisOpcional,
  campoTexto,
} from '@/lib/validacao';
import { calcularMarkup } from './service';

export const esquemaMarkup = z
  .object({
    mes: campoMes,
    taxaCartao: campoPercentual(),
    despesaFixa: campoPercentual(),
    imposto: campoPercentual(),
    comissao: campoPercentual(),
    investimentos: campoPercentual(),
    margemLucro: campoPercentual(),
  })
  .superRefine((p, ctx) => {
    const resultado = calcularMarkup({
      taxaCartao: p.taxaCartao,
      despesaFixa: p.despesaFixa,
      imposto: p.imposto,
      comissao: p.comissao,
      investimentos: p.investimentos,
      margemLucro: p.margemLucro,
    });
    if (!resultado.ok) {
      ctx.addIssue({ code: 'custom', path: ['margemLucro'], message: resultado.erro });
    }
  });

export const esquemaProduto = z.object({
  mes: campoMes,
  nome: campoTexto(120, 'Informe o nome do produto.'),
  custo: campoReais(),
  frete: campoReais(),
  embalagem: campoReais(),
  impostoEntrada: campoReais(),
  precoTrabalhado: campoReaisOpcional(),
  precoConcorrente: campoReaisOpcional(),
});

export const esquemaExcluirProduto = z.object({ id: campoId });
