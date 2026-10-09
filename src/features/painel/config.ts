import { LIMITE_PRO_LABORE } from '@/features/relatorios';

/** Limiares dos alertas do painel. Mude aqui para valer em todo o sistema. */
export const LIMIARES = {
  /** Alerta quando a empresa não lança há mais do que estes dias. */
  diasSemLancar: 3,
  /** Pró-labore acima deste percentual do faturamento. */
  proLaboreMaximo: LIMITE_PRO_LABORE,
};

export type Limiares = typeof LIMIARES;
