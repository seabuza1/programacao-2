import { mesAtual, parseMes, type Mes } from '@/lib/datas';

/** Mês do parâmetro ?mes=AAAA-MM; sem parâmetro válido, o mês corrente em São Paulo. */
export function mesDaUrl(valor: string | string[] | undefined): Mes {
  return parseMes(valor) ?? mesAtual(new Date());
}

/** Ano do parâmetro ?ano=AAAA; sem parâmetro válido, o ano corrente em São Paulo. */
export function anoDaUrl(valor: string | string[] | undefined): number {
  const ano = typeof valor === 'string' && /^\d{4}$/.test(valor) ? Number(valor) : NaN;
  return ano >= 2001 && ano <= 2100 ? ano : mesAtual(new Date()).ano;
}
