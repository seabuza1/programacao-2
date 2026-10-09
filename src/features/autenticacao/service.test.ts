import { describe, expect, it } from 'vitest';
import { esquemaCodigo, esquemaEntrar, esquemaNovaSenha } from './schema';
import { mensagemDeErroAuth } from './service';

describe('mensagemDeErroAuth', () => {
  it('traduz erros conhecidos', () => {
    expect(mensagemDeErroAuth('invalid_credentials')).toBe('E-mail ou senha incorretos.');
    expect(mensagemDeErroAuth('mfa_verification_failed')).toContain('Código incorreto');
  });

  it('usa mensagem genérica para o resto', () => {
    expect(mensagemDeErroAuth('user_not_found')).toBe('Não foi possível concluir. Tente de novo.');
    expect(mensagemDeErroAuth(undefined)).toBe('Não foi possível concluir. Tente de novo.');
  });
});

describe('esquemas', () => {
  it('normaliza o e-mail', () => {
    const dados = esquemaEntrar.parse({ email: '  Admin@GestaoFacil.TEST ', senha: 'x' });
    expect(dados.email).toBe('admin@gestaofacil.test');
  });

  it('aceita só os campos esperados', () => {
    const dados = esquemaEntrar.parse({ email: 'a@b.test', senha: 'x', admin_plataforma: true });
    expect(dados).toEqual({ email: 'a@b.test', senha: 'x' });
  });

  it('exige código de 6 dígitos', () => {
    const fatorId = '0b6f1c1e-4a4e-4c55-9d1e-2f0b7f1f9a10';
    expect(esquemaCodigo.safeParse({ fatorId, codigo: '123456' }).success).toBe(true);
    expect(esquemaCodigo.safeParse({ fatorId, codigo: '12345' }).success).toBe(false);
    expect(esquemaCodigo.safeParse({ fatorId, codigo: 'abcdef' }).success).toBe(false);
  });

  it('exige senha forte e confirmação igual', () => {
    expect(esquemaNovaSenha.safeParse({ senha: 'curta1', confirmacao: 'curta1' }).success).toBe(
      false,
    );
    expect(
      esquemaNovaSenha.safeParse({ senha: 'semnumeroaqui', confirmacao: 'semnumeroaqui' }).success,
    ).toBe(false);
    expect(
      esquemaNovaSenha.safeParse({ senha: 'senhaboa2026', confirmacao: 'senhaboa2027' }).success,
    ).toBe(false);
    expect(
      esquemaNovaSenha.safeParse({ senha: 'senhaboa2026', confirmacao: 'senhaboa2026' }).success,
    ).toBe(true);
  });
});
