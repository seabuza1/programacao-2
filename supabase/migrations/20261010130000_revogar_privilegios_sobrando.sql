-- Achado da verificação da demonstração na nuvem (2026-10-10): usuário logado tinha TRUNCATE em
-- formas_recebimento, plano_contas, parametros_mes e saldos_iniciais (a migration de cadastros não
-- revogou). TRUNCATE ignora RLS e gatilhos de linha: furaria a trava de mês fechado e a auditoria.
-- O app não usa TRUNCATE, TRIGGER, REFERENCES nem MAINTAIN: revoga de todas as tabelas, inclusive
-- das que vierem depois.

revoke truncate, trigger, references, maintain on all tables in schema public from authenticated;

alter default privileges for role postgres in schema public
  revoke truncate, trigger, references, maintain on tables from authenticated;
