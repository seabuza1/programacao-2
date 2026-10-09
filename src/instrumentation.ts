import type { Instrumentation } from 'next';
import { montarEvento, registrarEvento } from '@/lib/monitor';

/** Erros do servidor (páginas, ações, rotas e proxy), já sem dados sensíveis. */
export const onRequestError: Instrumentation.onRequestError = async (erro, request, contexto) => {
  await registrarEvento(
    montarEvento({
      erro,
      origem: 'servidor',
      rota: contexto.routePath,
      metodo: request.method,
      contexto: contexto.routeType,
      agora: new Date(),
    }),
  );
};
