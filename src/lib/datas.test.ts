import { describe, expect, it } from 'vitest';
import {
  compararMeses,
  dataValida,
  datasDoMes,
  diaDaSemana,
  diasEntre,
  diasNoMes,
  formatarData,
  hojeEmSaoPaulo,
  mesAnterior,
  nomeDoMes,
  parseMes,
  proximoMes,
  ultimoDia,
} from './datas';

describe('calendário', () => {
  it('conta os dias reais de cada mês', () => {
    expect(diasNoMes({ ano: 2026, mes: 2 })).toBe(28);
    expect(diasNoMes({ ano: 2028, mes: 2 })).toBe(29);
    expect(diasNoMes({ ano: 2026, mes: 4 })).toBe(30);
    expect(diasNoMes({ ano: 2026, mes: 1 })).toBe(31);
    expect(datasDoMes({ ano: 2026, mes: 2 })).toHaveLength(28);
    expect(ultimoDia({ ano: 2026, mes: 2 })).toBe('2026-02-28');
  });

  it('recusa datas que não existem (a planilha tem 31 colunas em todo mês)', () => {
    expect(dataValida('2026-02-28')).toBe(true);
    expect(dataValida('2026-02-29')).toBe(false);
    expect(dataValida('2026-02-31')).toBe(false);
    expect(dataValida('2026-04-31')).toBe(false);
    expect(dataValida('2028-02-29')).toBe(true);
    expect(dataValida('2026-13-01')).toBe(false);
    expect(dataValida('28/02/2026')).toBe(false);
  });

  it('navega entre meses', () => {
    expect(mesAnterior({ ano: 2026, mes: 1 })).toEqual({ ano: 2025, mes: 12 });
    expect(proximoMes({ ano: 2026, mes: 12 })).toEqual({ ano: 2027, mes: 1 });
    expect(compararMeses({ ano: 2026, mes: 1 }, { ano: 2026, mes: 2 })).toBeLessThan(0);
    expect(compararMeses({ ano: 2026, mes: 2 }, { ano: 2026, mes: 2 })).toBe(0);
  });

  it('lê o mês da URL', () => {
    expect(parseMes('2026-02')).toEqual({ ano: 2026, mes: 2 });
    expect(parseMes('2026-13')).toBeNull();
    expect(parseMes('2026-2')).toBeNull();
    expect(parseMes(undefined)).toBeNull();
  });

  it('conta dias entre datas', () => {
    expect(diasEntre('2026-02-25', '2026-02-28')).toBe(3);
    expect(diasEntre('2026-02-28', '2026-03-01')).toBe(1);
  });
});

describe('fuso de São Paulo', () => {
  it('usa a data de São Paulo, não a do servidor', () => {
    // 02:00 UTC de 1º de março ainda é 28 de fevereiro em São Paulo (UTC−3).
    expect(hojeEmSaoPaulo(new Date('2026-03-01T02:00:00Z'))).toBe('2026-02-28');
    expect(hojeEmSaoPaulo(new Date('2026-03-01T03:00:00Z'))).toBe('2026-03-01');
  });
});

describe('formatação', () => {
  it('formata em pt-BR', () => {
    expect(formatarData('2026-02-28')).toBe('28/02/2026');
    expect(nomeDoMes({ ano: 2026, mes: 2 })).toBe('fevereiro de 2026');
    expect(diaDaSemana('2026-02-28')).toBe('sáb');
  });
});
