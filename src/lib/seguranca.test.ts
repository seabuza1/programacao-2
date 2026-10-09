import { describe, expect, it } from 'vitest';
import { CABECALHOS_SEGURANCA, montarCsp, urlHttps } from './seguranca';

describe('montarCsp', () => {
  it('produção: nonce nos scripts e estilos, sem eval, sem inline de script', () => {
    const csp = montarCsp({ nonce: 'abc', desenvolvimento: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-abc'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('desenvolvimento libera eval para o React', () => {
    expect(montarCsp({ nonce: 'abc', desenvolvimento: true })).toContain("'unsafe-eval'");
  });
});

describe('cabeçalhos', () => {
  it('inclui HSTS, X-Frame-Options e nosniff', () => {
    const nomes = CABECALHOS_SEGURANCA.map((c) => c.key);
    expect(nomes).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
      ]),
    );
  });
});

describe('urlHttps', () => {
  it('redireciona http para https', () => {
    expect(urlHttps(new URL('http://gf.example/entrar?x=1'), 'http')?.toString()).toBe(
      'https://gf.example/entrar?x=1',
    );
    expect(urlHttps(new URL('https://gf.example/'), 'https')).toBeNull();
    expect(urlHttps(new URL('http://localhost:3000/'), null)).toBeNull();
    expect(urlHttps(new URL('http://localhost:3001/'), 'http')).toBeNull();
  });
});
