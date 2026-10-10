import { z } from 'zod';
import { campoData, campoReais } from '@/lib/validacao';

export const esquemaMovimentacao = z
  .object({
    data: campoData,
    tipo: z.enum(['saida', 'entrada', 'transferencia'], 'Escolha o tipo.'),
    caixa: z.enum(['dinheiro', 'banco'], 'Escolha o caixa.'),
    valor: campoReais({ minimo: 1 }),
    contaId: z.string().optional(),
    origem: z.string().optional(),
    descricao: z.string().trim().max(200, 'Use no máximo 200 caracteres.'),
  })
  .transform((m, ctx) => {
    // saida exige conta; entrada exige origem; nenhum outro tipo leva esses campos.
    const contaId = m.tipo === 'saida' ? z.uuid().safeParse(m.contaId) : null;
    if (contaId && !contaId.success) {
      ctx.addIssue({ code: 'custom', path: ['contaId'], message: 'Escolha a conta da saída.' });
      return z.NEVER;
    }
    const origem =
      m.tipo === 'entrada' ? z.enum(['recebimento_crediario', 'outro']).safeParse(m.origem) : null;
    if (origem && !origem.success) {
      ctx.addIssue({ code: 'custom', path: ['origem'], message: 'Escolha a origem da entrada.' });
      return z.NEVER;
    }
    return {
      data: m.data,
      tipo: m.tipo,
      caixa: m.caixa,
      valor: m.valor,
      descricao: m.descricao,
      contaId: contaId?.data ?? null,
      origem: origem?.data ?? null,
    };
  });

export const esquemaExclusao = z.object({ id: z.uuid() });
