const MENSAGENS: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  over_request_rate_limit: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Espere alguns minutos e tente de novo.',
  mfa_verification_failed: 'Código incorreto. Confira o app autenticador e tente de novo.',
  mfa_challenge_expired: 'O código expirou. Tente de novo.',
  weak_password: 'Senha fraca. Use pelo menos 10 caracteres, com letras e números.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  otp_expired: 'O link expirou ou já foi usado. Peça um novo.',
  reauthentication_needed: 'Por segurança, entre de novo antes de trocar a senha.',
  captcha_failed: 'Não foi possível confirmar que você não é um robô. Tente de novo.',
};

/** Mensagem da tela para um erro de Auth. Nunca diz se o e-mail existe. */
export function mensagemDeErroAuth(codigo: string | undefined): string {
  return (codigo && MENSAGENS[codigo]) ?? 'Não foi possível concluir. Tente de novo.';
}
