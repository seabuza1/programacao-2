'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { exigirEmpresa } from '@/features/acesso';
import { mesAtual } from '@/lib/datas';
import { falha, mensagemDoBanco, sucesso, type Resultado } from '@/lib/erros';
import { campoMes } from '@/lib/validacao';
import { fecharMes, reabrirMes } from './repository';
import { podeFecharAte, podeFecharMes } from './service';

const esquema = z.object({ mes: campoMes, operacao: z.enum(['fechar', 'reabrir']) });

export async function alterarFechamento(_: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await exigirEmpresa();
  const dados = esquema.safeParse({ mes: formData.get('mes'), operacao: formData.get('operacao') });
  if (!dados.success) return falha('Pedido inválido.');
  if (!podeFecharMes(contexto.papel)) {
    return falha('Só a administradora e o dono fecham e reabrem o mês.');
  }
  const { mes, operacao } = dados.data;
  if (operacao === 'fechar') {
    if (!podeFecharAte(mes, mesAtual(new Date()))) {
      return falha('Só é possível fechar um mês que já terminou.');
    }
    const { error } = await fecharMes(contexto.supabase, contexto.empresa.id, mes);
    if (error) {
      return falha(error.code === '23505' ? 'O mês já está fechado.' : mensagemDoBanco(error));
    }
  } else {
    const { error } = await reabrirMes(contexto.supabase, contexto.empresa.id, mes);
    if (error) return falha(mensagemDoBanco(error));
  }
  revalidatePath('/empresa', 'layout');
  return sucesso(operacao === 'fechar' ? 'Mês fechado.' : 'Mês reaberto.');
}
