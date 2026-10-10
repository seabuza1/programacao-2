/**
 * Monitor de erros sem dados financeiros nem pessoais.
 * O evento só leva: mensagem limpa, tipo do erro, digest, rota (arquivo, sem parâmetros),
 * método e contexto. Nunca cabeçalho, cookie, corpo, query nem valores.
 */

const TAMANHO_MAXIMO = 300;

const LIMPEZAS: [RegExp, string][] = [
  // E-mails.
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]'],
  // UUIDs (ids de empresa, usuário, lançamento).
  [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]'],
  // JWT (cabeçalho base64 começa com eyJ).
  [/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]*)?/g, '[token]'],
  // Outros tokens e chaves (sb_*, base64 longos).
  [/\b(sb_[a-z]+_)?[A-Za-z0-9_-]{24,}(\.[A-Za-z0-9_-]+)*\b/g, '[token]'],
  // Qualquer número, com ou sem separadores: valores, CPF, CNPJ, telefone, datas.
  [/(R\$\s?)?-?\d+([.,/:-]\d+)*/g, '[n]'],
];

export function limparTexto(texto: string): string {
  let limpo = texto;
  for (const [padrao, troca] of LIMPEZAS) {
    limpo = limpo.replace(padrao, troca);
  }
  return limpo.length > TAMANHO_MAXIMO ? `${limpo.slice(0, TAMANHO_MAXIMO)}…` : limpo;
}

export interface EventoDeErro {
  quando: string;
  origem: 'servidor' | 'navegador';
  tipo: string;
  mensagem: string;
  digest: string | null;
  rota: string;
  metodo: string | null;
  contexto: string | null;
}

export function montarEvento(dados: {
  erro: unknown;
  origem: EventoDeErro['origem'];
  rota: string;
  metodo?: string;
  contexto?: string;
  agora: Date;
}): EventoDeErro {
  const { erro } = dados;
  const mensagem = erro instanceof Error ? erro.message : typeof erro === 'string' ? erro : '';
  const digest =
    typeof erro === 'object' && erro !== null && 'digest' in erro ? String(erro.digest) : null;
  return {
    quando: dados.agora.toISOString(),
    origem: dados.origem,
    tipo: erro instanceof Error ? erro.name : typeof erro,
    mensagem: limparTexto(mensagem),
    digest: digest ? limparTexto(digest).slice(0, 40) : null,
    // Só o caminho do arquivo da rota (ex.: /(empresa)/empresa/caixa-diario), nunca a URL.
    rota: limparTexto(dados.rota.split('?')[0] ?? ''),
    metodo: dados.metodo ?? null,
    contexto: dados.contexto ?? null,
  };
}

/** Registra no log do servidor e, se houver, envia ao webhook. Nunca lança erro. */
export async function registrarEvento(evento: EventoDeErro): Promise<void> {
  console.error(JSON.stringify({ nivel: 'erro', ...evento }));
  const destino = process.env.ERROS_WEBHOOK_URL;
  if (!destino) {
    return;
  }
  try {
    await fetch(destino, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `text` deixa o evento legível em webhooks de chat (Slack, Discord, Google Chat).
      body: JSON.stringify({
        text: `Erro no Gestão Fácil (${evento.origem}) em ${evento.rota}: ${evento.mensagem}`,
        evento,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // O monitor não pode derrubar a requisição.
  }
}
