# Produção — passo a passo

Para você executar. O Claude não recebe credencial de produção nem roda migration em produção. Siga na ordem e marque cada item.

## 0. Antes de começar
- [ ] Contas: Supabase (plano **Pro**, para backups diários e PITR), Vercel, GitHub, Cloudflare (Turnstile) e um serviço de e-mail transacional (Resend, Amazon SES, SendGrid ou similar).
- [ ] Domínio do sistema (ex.: `app.gestaofacil.com.br`).
- [ ] Um gerenciador de senhas para guardar a senha do banco e as chaves. Nada de chave em e-mail, planilha ou chat.
- [ ] O código que vai para produção está na branch `main`, com o CI verde.

## 1. Criar o projeto no Supabase
1. [ ] **New project** → região **South America (São Paulo)** (`sa-east-1`).
2. [ ] Senha do banco gerada pelo gerenciador de senhas.
3. [ ] Anote o *project ref* (o código na URL do projeto).

## 2. Configurar o Auth (painel do Supabase → Authentication)
1. [ ] **Sign In / Providers**: desligue **Allow new users to sign up** (cadastro só por convite). Deixe o provedor **Email** ligado.
2. [ ] **Email**: confirmação de e-mail ligada; **Secure password change** ligado.
3. [ ] **Passwords**: mínimo **10** caracteres, exigindo letras e números.
4. [ ] **Multi-Factor**: **TOTP** habilitado (enroll e verify).
5. [ ] **URL Configuration**: *Site URL* = `https://SEU-DOMINIO`; *Redirect URLs* = `https://SEU-DOMINIO/**`.
6. [ ] **Emails → SMTP Settings**: ligue o SMTP próprio (o e-mail padrão do Supabase tem limite baixo e não serve para produção).
7. [ ] **Emails → Templates**: copie o conteúdo de `supabase/templates/convite.html` para *Invite user* e de `supabase/templates/redefinir-senha.html` para *Reset password*, com os assuntos de `supabase/config.toml`. Os links precisam apontar para `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=...`.
8. [ ] **Rate Limits**: confira os padrões do Supabase para login e envio de e-mail; não use os valores altos de `supabase/config.toml` (só servem para os testes locais).
9. [ ] **Bot and Abuse Protection** (depois do passo 6): ligue **Enable CAPTCHA protection**, provedor **Turnstile**, e cole a *Secret key* do Turnstile.

## 3. Aplicar o schema (migrations)
No seu computador, na pasta do projeto, com `pnpm install` feito:
```bash
pnpm supabase login
pnpm supabase link --project-ref SEU_PROJECT_REF
pnpm supabase db push          # aplica supabase/migrations, em ordem
pnpm supabase migration list   # todas devem aparecer em "Remote"
```
- [ ] **Nunca** rode `supabase/seed.sql` em produção (é só para dados fictícios locais).
- [ ] Confira no **SQL Editor** que toda tabela tem RLS (deve voltar vazio):
  ```sql
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  ```
- [ ] Mudança de schema daqui em diante: só por migration, revisada em PR, CI verde, e você roda `pnpm supabase db push` depois do merge. Nunca pelo painel.

## 4. Chaves
- [ ] **Settings → API Keys**: copie a *publishable key* e crie uma *secret key* só para a Vercel (nome: `vercel_producao`; o Supabase só aceita minúsculas, números e `_`).
- [ ] A chave secreta equivale à `service_role`: só vai para a Vercel como variável sensível, nunca em `NEXT_PUBLIC_`, nunca no código.

## 5. Turnstile (Cloudflare)
1. [ ] Cloudflare → **Turnstile** → **Add widget** com o domínio do sistema (modo *Managed*).
2. [ ] *Site key* → variável `TURNSTILE_SITE_KEY` na Vercel. *Secret key* → Supabase (passo 2.9).

## 6. Vercel
1. [ ] **Add New → Project** → importe `seabuza1/programacao-2` (ou o repositório definitivo). Framework: Next.js. Branch de produção: `main`.
2. [ ] **Settings → Environment Variables** (ambiente *Production*; marque como *Sensitive* as secretas):
   | Variável | Valor |
   | --- | --- |
   | `SUPABASE_URL` | `https://SEU_PROJECT_REF.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | chave publicável |
   | `SUPABASE_SECRET_KEY` | chave secreta (*Sensitive*) |
   | `SITE_URL` | `https://SEU-DOMINIO` |
   | `TURNSTILE_SITE_KEY` | site key do Turnstile |
   | `ERROS_WEBHOOK_URL` | opcional: endereço que recebe os eventos de erro (ex.: webhook de um canal privado do Slack ou Google Chat) (*Sensitive*) |
3. [ ] **Settings → Functions**: a região já vem de `vercel.json` (`gru1`, São Paulo, perto do banco).
4. [ ] **Domains**: adicione o domínio. A Vercel emite o certificado e força HTTPS; o app ainda manda HSTS.
5. [ ] Não crie variáveis para *Preview* apontando para produção. Prévias devem usar um projeto Supabase separado ou ficar sem banco.

## 7. Primeira administradora
1. [ ] Supabase → **Authentication → Users → Invite user** com o e-mail da administradora.
2. [ ] Ela abre o e-mail, clica em **Continuar**, define a senha e cadastra o app autenticador.
3. [ ] No **SQL Editor**:
   ```sql
   update public.usuarios set admin_plataforma = true where email = 'EMAIL-DA-ADMINISTRADORA';
   ```
4. [ ] Ela sai e entra de novo: o menu **Painel da administradora** aparece. Daí em diante, empresas e convites são criados pelo sistema.

## 8. Backups e recuperação ponto a ponto
1. [ ] Plano Pro: backups diários automáticos (7 dias) em **Database → Backups**.
2. [ ] Para recuperar até o minuto: **Add-ons → Point in Time Recovery** (exige computador *Small* ou maior; custo a partir de cerca de US$ 100/mês para 7 dias). Com PITR ligado, ele substitui os backups diários.
3. [ ] Cópia fora do Supabase (recomendado, semanal), guardada criptografada:
   ```bash
   pnpm supabase db dump --linked -f backup-esquema.sql
   pnpm supabase db dump --linked --data-only -f backup-dados.sql
   ```
   Esses arquivos têm dados financeiros: guarde só em local criptografado e com acesso restrito.

## 9. Testar uma restauração (obrigatório antes do piloto)
1. [ ] **Database → Backups → Restore to a New Project**: escolha o backup (ou o ponto no tempo, com PITR). Um projeto novo é criado na mesma região.
2. [ ] No projeto restaurado, confira no SQL Editor:
   ```sql
   select (select count(*) from public.empresas) as empresas,
          (select count(*) from public.entradas_diarias) as entradas,
          (select count(*) from public.movimentacoes) as movimentacoes,
          (select max(created_at) from public.auditoria) as ultima_alteracao;
   ```
   Os números precisam bater com produção no momento do backup.
3. [ ] Aponte um deploy de teste da Vercel (ou o `pnpm dev` local com `.env.local`) para o projeto restaurado, entre com uma conta e confira o resumo de um mês conhecido.
4. [ ] Anote data, backup usado, tempo da restauração e resultado. Depois **apague** o projeto restaurado (ele também tem dados reais).
5. [ ] Restaurar **no próprio projeto** de produção só em incidente (`docs/incidente.md`): ele fica fora do ar durante a restauração.

## 10. Conferência depois de publicar
- [ ] `https://SEU-DOMINIO/entrar` abre com o desafio do Turnstile.
- [ ] https://securityheaders.com com o domínio: CSP, HSTS, X-Frame-Options, nosniff presentes.
- [ ] Convite de teste chega com link para `/auth/confirmar`; senha e segundo fator funcionam.
- [ ] Exportação Excel e PDF baixam; a exportação completa (LGPD) baixa em JSON.
- [ ] `pnpm audit --prod` sem vulnerabilidade.

## Operações do dia a dia
- **Perdeu o celular do autenticador:** Authentication → Users → usuário → remover o fator MFA. No próximo login ela cadastra de novo.
- **Tirar o acesso de alguém:** remova o vínculo pela tela da empresa; para bloquear a conta inteira, Authentication → Users → *Ban user*.
- **Promover/rebaixar administradora da plataforma:** só pelo SQL Editor (`update public.usuarios set admin_plataforma = ... where email = ...`). Nenhuma tela faz isso.
- **Trocar a chave secreta:** crie uma nova em API Keys, atualize `SUPABASE_SECRET_KEY` na Vercel, faça *Redeploy*, confira o login e só então revogue a antiga.
- **Atualizar dependências:** PR com `pnpm update`, CI verde (inclui `pnpm audit --prod`).
