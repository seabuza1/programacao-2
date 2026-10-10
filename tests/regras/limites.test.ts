import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { clienteAnonimo, clienteServico, criarUsuario, entrar } from '../apoio/supabase';

describe('consumir_limite', () => {
  it('aceita até o máximo na janela e recusa depois', async () => {
    const servico = clienteServico();
    const chave = `teste:${randomUUID()}`;
    const tentativa = async () =>
      (await servico.rpc('consumir_limite', { p_chave: chave, p_maximo: 2, p_janela_segundos: 60 }))
        .data;
    expect(await tentativa()).toBe(true);
    expect(await tentativa()).toBe(true);
    expect(await tentativa()).toBe(false);
    const outra = await servico.rpc('consumir_limite', {
      p_chave: `teste:${randomUUID()}`,
      p_maximo: 2,
      p_janela_segundos: 60,
    });
    expect(outra.data).toBe(true);
  });

  it('janela vencida recomeça a contagem', async () => {
    const servico = clienteServico();
    const chave = `teste:${randomUUID()}`;
    const tentativa = async () =>
      (await servico.rpc('consumir_limite', { p_chave: chave, p_maximo: 1, p_janela_segundos: 1 }))
        .data;
    expect(await tentativa()).toBe(true);
    expect(await tentativa()).toBe(false);
    await new Promise((r) => setTimeout(r, 1100));
    expect(await tentativa()).toBe(true);
  });

  it('cliente logado ou anônimo não usa nem lê os limites', async () => {
    const usuario = await criarUsuario('limite');
    const logado = await entrar(usuario.email);
    for (const cliente of [logado, clienteAnonimo()]) {
      const chamada = await cliente.rpc('consumir_limite', {
        p_chave: 'x',
        p_maximo: 1000,
        p_janela_segundos: 1,
      });
      expect(chamada.error?.code).toBe('42501');
      const leitura = await cliente.from('limites_de_taxa').select('chave');
      expect(leitura.error?.code).toBe('42501');
    }
  });
});
