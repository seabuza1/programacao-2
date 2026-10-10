import { afterEach, describe, expect, it, vi } from 'vitest';
import { limparTexto, montarEvento, registrarEvento } from './monitor';

// Montada na hora para não parecer chave real (o GitHub bloqueia chaves no código).
const chaveFalsa = ['sb', 'secret', 'x'.repeat(32)].join('_');

describe('limparTexto', () => {
  it('tira e-mail, id, token e números', () => {
    const texto =
      'Falha para maria.silva@empresa.com.br na empresa 0b6f1c1e-4a4e-4c55-9d1e-2f0b7f1f9a10 ' +
      'valor R$ 1.588,27 CPF 123.456.789-00 tel (65) 99999-1234 data 2026-02-28 ' +
      `chave ${chaveFalsa} jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc`;
    const limpo = limparTexto(texto);
    expect(limpo).not.toMatch(
      /maria|empresa\.com|0b6f1c1e|1\.588|27|123\.456|99999|2026|sb_secret|eyJ/,
    );
    expect(limpo).toContain('[email]');
    expect(limpo).toContain('[id]');
    expect(limpo).toContain('[n]');
    expect(limpo).toContain('[token]');
  });

  it('tira até valor de um dígito', () => {
    expect(limparTexto('Saldo R$ 5 e 7 itens')).toBe('Saldo [n] e [n] itens');
  });

  it('mantém o texto do erro legível', () => {
    expect(limparTexto('Falha ao ler as empresas.')).toBe('Falha ao ler as empresas.');
  });

  it('corta mensagens longas', () => {
    expect(limparTexto('a '.repeat(400)).length).toBeLessThanOrEqual(301);
  });
});

describe('montarEvento', () => {
  it('leva só tipo, mensagem limpa, digest e rota sem parâmetros', () => {
    const erro = Object.assign(new TypeError('Saldo de 3.500,00 para ana@x.com'), {
      digest: '12345',
    });
    const evento = montarEvento({
      erro,
      origem: 'servidor',
      rota: '/(empresa)/empresa/fluxo-caixa?mes=2026-02',
      metodo: 'POST',
      contexto: 'action',
      agora: new Date('2026-10-09T12:00:00Z'),
    });
    expect(evento).toEqual({
      quando: '2026-10-09T12:00:00.000Z',
      origem: 'servidor',
      tipo: 'TypeError',
      mensagem: 'Saldo de [n] para [email]',
      digest: '[n]',
      rota: '/(empresa)/empresa/fluxo-caixa',
      metodo: 'POST',
      contexto: 'action',
    });
  });
});

describe('registrarEvento', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const evento = montarEvento({
    erro: new Error('Falha com R$ 1.234,56 de joao@x.com'),
    origem: 'servidor',
    rota: '/(empresa)/empresa',
    agora: new Date('2026-10-09T12:00:00Z'),
  });

  it('envia ao webhook só o evento limpo', async () => {
    vi.stubEnv('ERROS_WEBHOOK_URL', 'https://monitor.example/gancho');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const envio = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', envio);
    await registrarEvento(evento);
    expect(envio).toHaveBeenCalledOnce();
    const [destino, opcoes] = envio.mock.calls[0]!;
    expect(destino).toBe('https://monitor.example/gancho');
    const corpo = String((opcoes as RequestInit).body);
    expect(corpo).not.toMatch(/1\.234|joao|x\.com/);
    expect(JSON.parse(corpo).evento.mensagem).toBe('Falha com [n] de [email]');
  });

  it('sem webhook, só registra no log; falha do webhook não derruba nada', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const envio = vi.fn();
    vi.stubGlobal('fetch', envio);
    vi.stubEnv('ERROS_WEBHOOK_URL', '');
    await registrarEvento(evento);
    expect(envio).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();

    vi.stubEnv('ERROS_WEBHOOK_URL', 'https://monitor.example/gancho');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fora do ar')));
    await expect(registrarEvento(evento)).resolves.toBeUndefined();
  });
});
