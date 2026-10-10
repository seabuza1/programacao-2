'use server';

import { z } from 'zod';
import { dentroDoLimite, ipDoCliente } from '@/lib/limite';
import { montarEvento, registrarEvento } from '@/lib/monitor';

const esquema = z.object({
  mensagem: z.string().max(2000),
  digest: z.string().max(100).optional(),
  rota: z.string().max(300),
});

/** Erro capturado no navegador pelas páginas de erro. Passa pela mesma limpeza do servidor. */
export async function registrarErroDoNavegador(dados: unknown): Promise<void> {
  const valido = esquema.safeParse(dados);
  if (!valido.success || !(await dentroDoLimite('errosDoNavegador', await ipDoCliente()))) {
    return;
  }
  const { mensagem, digest, rota } = valido.data;
  await registrarEvento(
    montarEvento({
      erro: Object.assign(new Error(mensagem), digest ? { digest } : {}),
      origem: 'navegador',
      rota,
      agora: new Date(),
    }),
  );
}
