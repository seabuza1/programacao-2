import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { exigirEmpresa } from '@/features/acesso';
import { listarParametros, parametrosVazios } from '@/features/cadastros';
import { carregarHistorico } from '@/features/fluxo-caixa';
import {
  dadosDoAno,
  relatorioAnual,
  resumoDoMes,
  tabelaAnual,
  tabelaGerencial,
} from '@/features/relatorios';
import { chaveDoMes, mesAtual, parseMes } from '@/lib/datas';
import { gerarPdf } from '@/lib/exportar/pdf';
import { nomeDeArquivo, type Tabela } from '@/lib/exportar/tabela';
import { gerarXlsx } from '@/lib/exportar/xlsx';
import { dentroDoLimite, MENSAGEM_LIMITE } from '@/lib/limite';

const esquema = z.object({
  relatorio: z.enum(['gerencial', 'anual']),
  formato: z.enum(['xlsx', 'pdf']),
  periodo: z.string().max(7).optional(),
});

const TIPOS = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

/** Exportação gerada no servidor, com a mesma checagem das telas (sessão, empresa ativa, vínculo). */
export async function GET(request: NextRequest) {
  const { supabase, empresa, usuario } = await exigirEmpresa();
  if (!(await dentroDoLimite('exportacaoPorUsuario', usuario.id))) {
    return new Response(MENSAGEM_LIMITE, { status: 429, headers: { 'Retry-After': '600' } });
  }
  const dados = esquema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!dados.success) {
    return new Response('Pedido inválido.', { status: 400 });
  }
  const { relatorio, formato, periodo } = dados.data;
  let tabela: Tabela;
  let rotulo: string;
  if (relatorio === 'gerencial') {
    const mes = parseMes(periodo) ?? mesAtual(new Date());
    const [historico, parametros] = await Promise.all([
      carregarHistorico(supabase, empresa.id, mes),
      listarParametros(supabase, empresa.id),
    ]);
    const { gerencial } = resumoDoMes(
      historico,
      mes,
      parametros[chaveDoMes(mes)] ?? parametrosVazios(),
    );
    tabela = tabelaGerencial(gerencial, empresa.nome, mes);
    rotulo = chaveDoMes(mes);
  } else {
    const ano = /^\d{4}$/.test(periodo ?? '') ? Number(periodo) : mesAtual(new Date()).ano;
    const historico = await carregarHistorico(supabase, empresa.id, { ano, mes: 12 });
    const anual = relatorioAnual({
      formas: historico.formas,
      contas: historico.contas,
      meses: dadosDoAno(historico, ano),
    });
    tabela = tabelaAnual(anual, empresa.nome, ano);
    rotulo = String(ano);
  }
  const corpo = formato === 'xlsx' ? await gerarXlsx(tabela) : await gerarPdf(tabela);
  const arquivo = nomeDeArquivo([empresa.nome, relatorio, rotulo], formato);
  return new Response(new Uint8Array(corpo), {
    headers: {
      'Content-Type': TIPOS[formato],
      'Content-Disposition': `attachment; filename="${arquivo}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
