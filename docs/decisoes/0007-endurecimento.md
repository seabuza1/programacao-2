# 0007 — Endurecimento

**Data:** 2026-10-09 · **Status:** aceita

## Decisão
- **Limite de tentativas no banco** (`limites_de_taxa` + `consumir_limite`): vale entre instâncias da Vercel sem serviço extra. Chave com hash (sem e-mail ou IP em claro). Se o banco falhar, o limite deixa passar; o Supabase Auth tem limites próprios como segunda barreira. Valores em `src/lib/limite.ts`.
- **Proteção contra robô**: Cloudflare Turnstile verificado pelo próprio Supabase Auth (sem chave secreta no app) e campo-armadilha. Ligado só quando `TURNSTILE_SITE_KEY` existe.
- **CSP com nonce** gerado no proxy a cada requisição; por isso toda página é dinâmica (`connection()` no layout raiz). Estilos em atributo liberados só por `style-src-attr`.
- **HTTPS**: redirecionamento 308 no proxy (exceto `localhost`) além do da Vercel, e HSTS com preload.
- **Monitor de erros** sem fornecedor: `onRequestError` e páginas de erro geram eventos limpos (`src/lib/monitor.ts`) para o log e para um webhook opcional. Trocar por um serviço dedicado depois é trocar `registrarEvento`.
- **LGPD**: exportação completa em JSON e exclusão por `excluir_empresa`, que só abre as travas para a empresa em exclusão (configuração local à transação, que o cliente não consegue definir pela API).
- **Guarda do catálogo no CI** (`tests/regras/catalogo.test.ts`): RLS em toda tabela, policy para toda operação liberada, nada executável por anônimo, `search_path` fixo e sem SQL dinâmico em função.
- **Região**: funções da Vercel em São Paulo (`gru1`, `vercel.json`), perto do banco em `sa-east-1`.

## Consequências
Sem cache de página na CDN (todas dinâmicas): aceitável para um sistema logado de formulários e relatórios.
