import 'server-only';

const TAMANHO_DA_PAGINA = 1000;

interface Pagina<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/**
 * Busca todas as linhas de uma consulta, página por página.
 * A API do Supabase devolve no máximo 1.000 linhas por chamada.
 * A consulta precisa de ordenação estável (ex.: .order('id')).
 */
export async function buscarTodas<T>(
  consulta: (de: number, ate: number) => PromiseLike<Pagina<T>>,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += TAMANHO_DA_PAGINA) {
    const { data, error } = await consulta(de, de + TAMANHO_DA_PAGINA - 1);
    if (error) {
      throw new Error(`Falha ao consultar o banco: ${error.message}`);
    }
    linhas.push(...(data ?? []));
    if (!data || data.length < TAMANHO_DA_PAGINA) {
      return linhas;
    }
  }
}
