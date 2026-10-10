import { describe, expect, it } from 'vitest';
import { r } from '../../../tests/dominio/padrao';
import { percentual } from '@/lib/percent';
import { LIMIARES } from './config';
import { alertasDaEmpresa, consolidarLinha, type LinhaBruta } from './service';

/** Fevereiro dos casos D e E, sem as saídas de janeiro. */
const fevereiro: LinhaBruta = {
  empresaId: 'e',
  nome: 'Loja',
  setor: 'comercio',
  saldoInicialDinheiro: r(300),
  saldoInicialBanco: r(3500),
  entradasDinheiro: r(35000 + 711),
  entradasBanco: r(1588.27 + 740.78 + 622.36),
  taxasCartao: r(19.06 + 77.78),
  movimentoDinheiro: r(0),
  movimentoBanco: r(0),
  faturamentoMes: r(3717.41),
  saidasMes: r(0),
  taxasCartaoMes: r(96.84),
  proLaboreMes: r(0),
  diasLancadosMes: 1,
  diasPrevistos: 25,
  meta: r(0),
  ultimoLancamento: '2026-02-28',
  margemLucro: percentual(950),
};

describe('consolidarLinha', () => {
  it('fecha com os casos E e F', () => {
    const linha = consolidarLinha(fevereiro);
    expect(linha.saldoDinheiro).toBe(r(36011));
    expect(linha.saldoBanco).toBe(r(6354.57));
    expect(linha.lucro).toBe(r(3620.57));
    expect(linha.previsao).toBe(r(92935.25));
  });
});

describe('alertasDaEmpresa', () => {
  const tipos = (bruta: Partial<LinhaBruta>, hoje = '2026-03-02') =>
    alertasDaEmpresa(consolidarLinha({ ...fevereiro, ...bruta }), hoje, LIMIARES).map(
      (a) => a.tipo,
    );

  it('sem problemas, sem alertas (margem 15% no comércio)', () => {
    expect(tipos({ margemLucro: percentual(1500) })).toEqual([]);
  });

  it('previsão abaixo da meta', () => {
    expect(tipos({ meta: r(100000), margemLucro: percentual(1500) })).toEqual([
      'previsao_abaixo_meta',
    ]);
  });

  it('lucro negativo', () => {
    expect(tipos({ saidasMes: r(5000), margemLucro: percentual(1500) })).toContain(
      'lucro_negativo',
    );
  });

  it('pró-labore acima de 20%', () => {
    expect(tipos({ proLaboreMes: r(800), margemLucro: percentual(1500) })).toContain(
      'pro_labore_alto',
    );
    expect(tipos({ proLaboreMes: r(700), margemLucro: percentual(1500) })).not.toContain(
      'pro_labore_alto',
    );
  });

  it('saldo negativo', () => {
    expect(tipos({ movimentoBanco: r(-10000), margemLucro: percentual(1500) })).toContain(
      'saldo_negativo',
    );
  });

  it('margem fora da faixa do setor (9,5% no comércio)', () => {
    expect(tipos({})).toEqual(['margem_fora_faixa']);
    expect(tipos({ setor: null })).toEqual([]);
  });

  it('sem lançar há mais de 3 dias', () => {
    const margem = { margemLucro: percentual(1500) };
    expect(tipos(margem, '2026-03-03')).toEqual([]);
    expect(tipos(margem, '2026-03-04')).toEqual(['sem_lancar']);
    expect(tipos({ ...margem, ultimoLancamento: null })).toEqual(['sem_lancar']);
  });
});
