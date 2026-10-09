# Plano de incidente (uma página)

**Incidente** é qualquer suspeita de: acesso indevido a dados (inclusive de uma empresa vendo dado de outra), vazamento de chave ou senha, perda ou alteração indevida de dados, ou sistema fora do ar. Na dúvida, trate como incidente.

Responsável: [nome] · Substituto: [nome] · Advogado/encarregado (DPO): [nome, telefone]

## 1. Conter (primeiros 30 minutos)
- [ ] Anote a hora em que soube e como soube.
- [ ] **Chave vazada:** crie uma chave secreta nova no Supabase, atualize `SUPABASE_SECRET_KEY` na Vercel, faça *Redeploy* e revogue a antiga. Se foi a senha do banco, troque em Database → Settings.
- [ ] **Conta comprometida:** Authentication → Users → *Ban user* e remova os fatores MFA; remova os vínculos dela.
- [ ] **Dado exposto em andamento ou falha grave:** tire o sistema do ar pausando o projeto na Vercel (opção *Pause Project*) até entender o problema.
- [ ] **Não apague nada.** Logs e a tabela `auditoria` são as evidências.

## 2. Entender (até 24 horas)
- [ ] Quais empresas, quais dados, desde quando. Fontes:
  - tabela `public.auditoria` (quem alterou o quê e quando, por empresa);
  - logs do Supabase (Auth, API, Postgres) e da Vercel;
  - eventos do monitor de erros (`ERROS_WEBHOOK_URL`).
- [ ] Reproduza com dados fictícios no ambiente local e escreva um teste que falha mostrando o problema.

## 3. Comunicar
- [ ] Se houver risco ou dano relevante a titulares: comunicar a ANPD e as pessoas afetadas (LGPD, art. 48; o regulamento da ANPD fixa prazo curto, de dias úteis — **confirmar o prazo vigente com o advogado**).
- [ ] Avisar as empresas clientes afetadas: o que aconteceu, quais dados, o que já foi feito e o que elas devem fazer (ex.: trocar senha).
- [ ] Uma pessoa só fala em nome da Gestão Fácil. Nada de detalhe técnico que ajude um atacante.

## 4. Corrigir e recuperar
- [ ] Correção com teste, PR, CI verde e deploy.
- [ ] Dados perdidos ou corrompidos: restaurar com PITR/backup (`docs/producao.md`, seções 8 e 9). Restaurar primeiro em um projeto novo para conferir; só depois no de produção.
- [ ] Conferir isolamento: `pnpm test:db` e a auditoria de segurança (`docs/auditoria-seguranca.md`).

## 5. Registrar (até 5 dias úteis)
Relatório curto: linha do tempo, causa, dados e empresas afetadas, comunicações feitas (com datas), correções e o que muda para não repetir. Guardar junto com as evidências.

## Contatos
Supabase: suporte pelo painel (Support) · Vercel: suporte pelo painel · ANPD: canal oficial no site gov.br/anpd · Advogado: [preencher]
