/** Cookies de sessão: o JavaScript da página não lê (HttpOnly), só vão por HTTPS em produção. */
export const opcoesCookieSessao = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
