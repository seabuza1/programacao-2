import { z } from 'zod';
import { campoData, campoId, campoInteiro, campoReais, campoReaisOpcional } from '@/lib/validacao';

export const esquemaCelula = z.object({
  data: campoData,
  formaId: campoId,
  valor: campoReaisOpcional(),
});

export const esquemaIndicador = z.object({
  data: campoData,
  qtdVendas: campoInteiro({ maximo: 1_000_000 }),
  qtdProdutos: campoInteiro({ maximo: 10_000_000 }),
  descontos: campoReais(),
});
