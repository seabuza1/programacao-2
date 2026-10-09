import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  campoData,
  campoInteiro,
  campoPercentual,
  campoReais,
  campoReaisOpcional,
} from './validacao';

const mensagem = (esquema: z.ZodType, valor: unknown) => {
  const resultado = esquema.safeParse(valor);
  return resultado.success ? null : resultado.error.issues[0]?.message;
};

describe('campos', () => {
  it('lê reais e percentuais em pt-BR', () => {
    expect(campoReais().parse('1.234,56')).toBe(123456);
    expect(campoReais().parse('')).toBe(0);
    expect(campoReaisOpcional().parse('')).toBeNull();
    expect(campoPercentual().parse('1,2%')).toBe(120);
  });

  it('dá mensagens em português', () => {
    expect(mensagem(campoReais(), '12,345')).toBe('Valor inválido. Use o formato 1.234,56.');
    expect(mensagem(campoReais(), '-1,00')).toBe('O valor não pode ser negativo.');
    expect(mensagem(campoInteiro({ maximo: 31 }), '40')).toBe('Use um número até 31.');
    expect(mensagem(campoInteiro(), '2,5')).toBe('Use um número inteiro.');
    expect(mensagem(campoPercentual(), '101')).toBe('Use um valor entre 0% e 100%.');
    expect(mensagem(campoData, '2026-02-30')).toBe('Data inválida.');
  });

  it('mensagem padrão do Zod também vem em português', () => {
    const texto = mensagem(z.string(), 10);
    expect(texto).not.toMatch(/expected/i);
  });
});
