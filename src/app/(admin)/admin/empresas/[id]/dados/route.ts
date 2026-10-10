import { z } from 'zod';
import { exigirAdminPlataforma } from '@/features/acesso';
import { ehAdminDaEmpresa } from '@/features/anotacoes';
import { lerDadosDaEmpresa, montarPacote } from '@/features/lgpd';
import { nomeDeArquivo } from '@/lib/exportar/tabela';
import { dentroDoLimite, MENSAGEM_LIMITE } from '@/lib/limite';

/** Exportação completa (portabilidade, LGPD). Só a admin da plataforma com vínculo admin. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, usuario } = await exigirAdminPlataforma();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success || !(await ehAdminDaEmpresa(supabase, id.data))) {
    return new Response('Não encontrado.', { status: 404 });
  }
  if (!(await dentroDoLimite('exportacaoPorUsuario', usuario.id))) {
    return new Response(MENSAGEM_LIMITE, { status: 429, headers: { 'Retry-After': '600' } });
  }
  const dados = await lerDadosDaEmpresa(supabase, id.data);
  const pacote = montarPacote({ ...dados, geradoEm: new Date().toISOString() });
  const nome = String(dados.empresa.nome ?? 'empresa');
  return new Response(JSON.stringify(pacote, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeDeArquivo(['dados', nome], 'json')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
