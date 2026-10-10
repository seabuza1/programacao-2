import { describe, expect, it } from 'vitest';
import {
  exigeSegundoFator,
  podeGerenciar,
  podeLancar,
  rotaDeRetornoSegura,
  rotaInicial,
} from './service';

describe('papéis', () => {
  it('leitor só lê', () => {
    expect(podeLancar('leitor')).toBe(false);
    expect(podeGerenciar('leitor')).toBe(false);
  });

  it('operador lança, mas não gerencia', () => {
    expect(podeLancar('operador')).toBe(true);
    expect(podeGerenciar('operador')).toBe(false);
  });

  it('admin e dono fazem tudo', () => {
    for (const papel of ['admin', 'dono'] as const) {
      expect(podeLancar(papel)).toBe(true);
      expect(podeGerenciar(papel)).toBe(true);
    }
  });
});

describe('exigeSegundoFator', () => {
  it('exige quando o papel pede e a sessão não tem segundo fator', () => {
    expect(exigeSegundoFator(true, 'aal1')).toBe(true);
    expect(exigeSegundoFator(true, null)).toBe(true);
  });

  it('libera com segundo fator confirmado ou quando o papel não pede', () => {
    expect(exigeSegundoFator(true, 'aal2')).toBe(false);
    expect(exigeSegundoFator(false, 'aal1')).toBe(false);
  });
});

describe('rotas', () => {
  it('admin da plataforma vai para o painel', () => {
    expect(rotaInicial(true)).toBe('/admin');
    expect(rotaInicial(false)).toBe('/empresa');
  });

  it('só aceita retorno para rota interna conhecida', () => {
    expect(rotaDeRetornoSegura('/definir-senha')).toBe('/definir-senha');
    expect(rotaDeRetornoSegura('https://malicioso.example')).toBeNull();
    expect(rotaDeRetornoSegura('//malicioso.example')).toBeNull();
    expect(rotaDeRetornoSegura(undefined)).toBeNull();
  });
});
