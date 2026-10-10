/**
 * Datas de lançamento como texto 'AAAA-MM-DD' (o `date` do banco), sem fuso.
 * Contas de calendário em UTC para não depender do fuso do servidor.
 */

export interface Mes {
  ano: number;
  /** 1 a 12 */
  mes: number;
}

const FUSO = 'America/Sao_Paulo';

const NOMES_DOS_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Data de hoje em São Paulo. Recebe o instante para ficar testável. */
export function hojeEmSaoPaulo(agora: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

/** Mês corrente em São Paulo. */
export function mesAtual(agora: Date): Mes {
  return mesDe(hojeEmSaoPaulo(agora));
}

export function diasNoMes({ ano, mes }: Mes): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Valida pelo calendário real: '2026-02-30' é inválida. */
export function dataValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) {
    return false;
  }
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  return (
    ano >= 2000 &&
    ano <= 2100 &&
    mes >= 1 &&
    mes <= 12 &&
    dia >= 1 &&
    dia <= diasNoMes({ ano, mes })
  );
}

export function mesDe(data: string): Mes {
  return { ano: Number(data.slice(0, 4)), mes: Number(data.slice(5, 7)) };
}

export function chaveDoMes({ ano, mes }: Mes): string {
  return `${ano}-${doisDigitos(mes)}`;
}

/** Lê 'AAAA-MM' (parâmetro de URL). */
export function parseMes(texto: unknown): Mes | null {
  if (typeof texto !== 'string') {
    return null;
  }
  const partes = /^(\d{4})-(\d{2})$/.exec(texto);
  if (!partes) {
    return null;
  }
  const mes = { ano: Number(partes[1]), mes: Number(partes[2]) };
  return mes.ano >= 2000 && mes.ano <= 2100 && mes.mes >= 1 && mes.mes <= 12 ? mes : null;
}

export function primeiroDia(mes: Mes): string {
  return `${chaveDoMes(mes)}-01`;
}

export function ultimoDia(mes: Mes): string {
  return `${chaveDoMes(mes)}-${doisDigitos(diasNoMes(mes))}`;
}

export function datasDoMes(mes: Mes): string[] {
  return Array.from(
    { length: diasNoMes(mes) },
    (_, i) => `${chaveDoMes(mes)}-${doisDigitos(i + 1)}`,
  );
}

export function mesAnterior({ ano, mes }: Mes): Mes {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

export function proximoMes({ ano, mes }: Mes): Mes {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

/** Negativo se a vem antes de b. */
export function compararMeses(a: Mes, b: Mes): number {
  return a.ano * 12 + a.mes - (b.ano * 12 + b.mes);
}

export function diasEntre(de: string, ate: string): number {
  const utc = (data: string) =>
    Date.UTC(Number(data.slice(0, 4)), Number(data.slice(5, 7)) - 1, Number(data.slice(8, 10)));
  return Math.round((utc(ate) - utc(de)) / 86_400_000);
}

/** '28/02/2026' */
export function formatarData(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

/** 'fevereiro de 2026' */
export function nomeDoMes({ ano, mes }: Mes): string {
  return `${NOMES_DOS_MESES[mes - 1]} de ${ano}`;
}

/** 'fev' */
export function nomeCurtoDoMes(mes: number): string {
  return (NOMES_DOS_MESES[mes - 1] ?? '').slice(0, 3);
}

/** Dia da semana abreviado: 'sáb'. */
export function diaDaSemana(data: string): string {
  const dia = new Date(`${data}T12:00:00Z`).getUTCDay();
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dia] ?? '';
}
