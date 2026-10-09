import { z } from 'zod';
import { PAPEIS } from '@/features/acesso';

export const esquemaConvite = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Informe um e-mail válido.').max(254, 'E-mail longo demais.')),
  empresaId: z.uuid('Escolha a empresa.'),
  papel: z.enum(PAPEIS, 'Escolha o papel.'),
});

export const esquemaAlterarVinculo = z.object({
  vinculoId: z.uuid(),
  papel: z.enum(PAPEIS),
});

export const esquemaRemoverVinculo = z.object({ vinculoId: z.uuid() });
