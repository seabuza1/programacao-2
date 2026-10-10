'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { exigirEmpresa, podeGerenciar } from '@/features/acesso';
import { falha, falhaDeValidacao, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { campoInteiro, campoPercentual, campoReais } from '@/lib/validacao';
import { salvarAnalise } from './repository';

const MESES = Array.from({ length: 12 }, (_, i) => `anterior${i + 1}`);

const esquemaAnalise = z.object({
  ano: campoInteiro({ minimo: 2001, maximo: 2100 }),
  crescimento: campoPercentual({ minimo: -10_000, maximo: 100_000 }),
  anterior: z.array(campoReais()).length(12),
});

export async function salvarAnaliseDoAno(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquemaAnalise.safeParse({
    ano: formData.get('ano'),
    crescimento: formData.get('crescimento'),
    anterior: MESES.map((nome) => formData.get(nome) ?? ''),
  });
  if (!dados.success) {
    // anterior.3 → anterior4 (nome do campo no formulário)
    const erro = falhaDeValidacao(dados.error);
    if (!erro.ok && erro.campos) {
      erro.campos = Object.fromEntries(
        Object.entries(erro.campos).map(([campo, msg]) => {
          const mes = /^anterior\.(\d+)$/.exec(campo);
          return [mes ? `anterior${Number(mes[1]) + 1}` : campo, msg];
        }),
      );
    }
    return erro;
  }
  if (!podeGerenciar(contexto.papel)) {
    return falha('Só a administradora e o dono alteram a análise de faturamento.');
  }
  const { ano, anterior, crescimento } = dados.data;
  const { error } = await salvarAnalise(
    contexto.supabase,
    contexto.empresa.id,
    ano,
    anterior,
    crescimento,
  );
  if (error) return falha(mensagemDoBanco(error));
  revalidatePath('/empresa/relatorios');
  return sucesso('Análise salva.');
}
