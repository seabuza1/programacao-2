import type { Papel } from '@/features/acesso';
import { compararMeses, type Mes } from '@/lib/datas';

/** Fechar e reabrir mês: admin e dono. */
export function podeFecharMes(papel: Papel): boolean {
  return papel === 'admin' || papel === 'dono';
}

/** Não se fecha mês que ainda não terminou. */
export function podeFecharAte(mes: Mes, mesCorrente: Mes): boolean {
  return compararMeses(mes, mesCorrente) < 0;
}
