import 'server-only';
import { z } from 'zod';

const esquema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SITE_URL: z.url(),
});

export interface Ambiente {
  supabaseUrl: string;
  supabasePublishableKey: string;
  siteUrl: string;
}

let lido: Ambiente | undefined;

/** Variáveis de ambiente do servidor. Nenhuma é NEXT_PUBLIC_: o navegador não fala com o Supabase. */
export function ambiente(): Ambiente {
  if (!lido) {
    const resultado = esquema.safeParse(process.env);
    if (!resultado.success) {
      const nomes = resultado.error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${nomes}. Veja .env.example.`);
    }
    lido = {
      supabaseUrl: resultado.data.SUPABASE_URL,
      supabasePublishableKey: resultado.data.SUPABASE_PUBLISHABLE_KEY,
      siteUrl: resultado.data.SITE_URL.replace(/\/$/, ''),
    };
  }
  return lido;
}

/** Equivale à service_role. Só para src/lib/supabase/admin.ts. */
export function chaveSecretaSupabase(): string {
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!chave) {
    throw new Error('Variável de ambiente ausente: SUPABASE_SECRET_KEY. Veja .env.example.');
  }
  return chave;
}
