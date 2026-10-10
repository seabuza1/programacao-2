import { z } from 'zod';
import {
  campoId,
  campoInteiro,
  campoMarcado,
  campoMes,
  campoPercentual,
  campoReais,
  campoTexto,
} from '@/lib/validacao';
import { DESTINOS, GRUPOS, diasPrevistosValidos } from './service';

export const esquemaNovaForma = z.object({
  nome: campoTexto(60, 'Informe o nome.'),
  destino: z.enum(DESTINOS, 'Escolha o destino.'),
  contaFaturamento: campoMarcado,
});

export const esquemaNovaConta = z.object({
  nome: campoTexto(80, 'Informe o nome.'),
  grupo: z.enum(GRUPOS, 'Escolha o grupo.'),
});

export const esquemaRenomear = z.object({
  id: campoId,
  nome: campoTexto(80, 'Informe o nome.'),
});

export const esquemaAtivar = z.object({
  id: campoId,
  ativa: z.enum(['true', 'false']).transform((valor) => valor === 'true'),
});

export const esquemaParametros = z
  .object({
    mes: campoMes,
    diasPrevistos: campoInteiro({ maximo: 31 }),
    meta: campoReais(),
    taxaDebito: campoPercentual(),
    taxaCredito: campoPercentual(),
  })
  .refine((p) => diasPrevistosValidos(p.diasPrevistos, p.mes), {
    path: ['diasPrevistos'],
    message: 'Mais dias do que o mês tem.',
  });

export const esquemaSaldosIniciais = z.object({
  mesInicio: campoMes,
  dinheiro: campoReais({ minimo: Number.MIN_SAFE_INTEGER }),
  banco: campoReais({ minimo: Number.MIN_SAFE_INTEGER }),
});
