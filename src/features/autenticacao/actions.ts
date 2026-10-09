'use server';

import { redirect } from 'next/navigation';
import { limparEmpresaAtiva, obterUsuarioParcial, rotaDeRetornoSegura } from '@/features/acesso';
import { ambiente } from '@/lib/ambiente';
import { ecoar, falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/erros';
import { dentroDoLimite, ipDoCliente, MENSAGEM_LIMITE } from '@/lib/limite';
import { criarClienteServidor } from '@/lib/supabase/server';
import {
  cadastrarFator,
  confirmarLink,
  entrarComSenha,
  fatorConfirmado,
  pedirRedefinicao,
  sair as encerrarSessao,
  trocarSenha,
  verificarCodigo,
  type FatorTotp,
} from './repository';
import {
  esquemaCodigo,
  esquemaConfirmacao,
  esquemaEntrar,
  esquemaEsqueciSenha,
  esquemaNovaSenha,
} from './schema';
import { mensagemDeErroAuth } from './service';

/** Token do Cloudflare Turnstile, quando o desafio está ligado. */
function tokenDoDesafio(formData: FormData): string | undefined {
  const token = formData.get('cf-turnstile-response');
  return typeof token === 'string' && token.length > 0 ? token.slice(0, 2048) : undefined;
}

/** Campo-armadilha invisível: gente não preenche, robô sim. */
function ehRobo(formData: FormData): boolean {
  return Boolean(formData.get('site'));
}

export async function entrar(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  if (ehRobo(formData)) {
    return falha(mensagemDeErroAuth('invalid_credentials'));
  }
  const dados = esquemaEntrar.safeParse({
    email: formData.get('email'),
    senha: formData.get('senha'),
  });
  const valores = ecoar(formData, ['email']);
  if (!dados.success) {
    return falhaDeValidacao(dados.error, valores);
  }
  const [porIp, porEmail] = await Promise.all([
    dentroDoLimite('loginPorIp', await ipDoCliente()),
    dentroDoLimite('loginPorEmail', dados.data.email),
  ]);
  if (!porIp || !porEmail) {
    return falha(MENSAGEM_LIMITE, undefined, valores);
  }
  const supabase = await criarClienteServidor();
  const erro = await entrarComSenha(
    supabase,
    dados.data.email,
    dados.data.senha,
    tokenDoDesafio(formData),
  );
  if (erro) {
    return falha(mensagemDeErroAuth(erro), undefined, valores);
  }
  redirect('/');
}

export type ResultadoCadastro = Resultado & { fator?: FatorTotp };

export async function cadastrarAutenticador(): Promise<ResultadoCadastro> {
  const contexto = await obterUsuarioParcial();
  if (!contexto) {
    redirect('/entrar');
  }
  if (await fatorConfirmado(contexto.supabase)) {
    return falha('Você já tem um autenticador cadastrado.');
  }
  const fator = await cadastrarFator(contexto.supabase);
  if (typeof fator === 'string') {
    return falha(mensagemDeErroAuth(fator));
  }
  return { ok: true, fator };
}

export async function confirmarCodigo(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const contexto = await obterUsuarioParcial();
  if (!contexto) {
    redirect('/entrar');
  }
  const dados = esquemaCodigo.safeParse({
    fatorId: formData.get('fatorId'),
    codigo: formData.get('codigo'),
  });
  if (!dados.success) {
    return falhaDeValidacao(dados.error);
  }
  if (!(await dentroDoLimite('codigoPorUsuario', contexto.usuario.id))) {
    return falha(MENSAGEM_LIMITE);
  }
  const erro = await verificarCodigo(contexto.supabase, dados.data.fatorId, dados.data.codigo);
  if (erro) {
    return falha(mensagemDeErroAuth(erro));
  }
  redirect(rotaDeRetornoSegura(formData.get('proximo')) ?? '/');
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await encerrarSessao(supabase);
  await limparEmpresaAtiva();
  redirect('/entrar');
}

export async function esqueciSenha(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  if (ehRobo(formData)) {
    return sucesso('Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.');
  }
  const dados = esquemaEsqueciSenha.safeParse({ email: formData.get('email') });
  if (!dados.success) {
    return falhaDeValidacao(dados.error, ecoar(formData, ['email']));
  }
  const [porIp, porEmail] = await Promise.all([
    dentroDoLimite('senhaPorIp', await ipDoCliente()),
    dentroDoLimite('senhaPorEmail', dados.data.email),
  ]);
  if (!porIp || !porEmail) {
    return falha(MENSAGEM_LIMITE, undefined, ecoar(formData, ['email']));
  }
  const supabase = await criarClienteServidor();
  const erro = await pedirRedefinicao(
    supabase,
    dados.data.email,
    `${ambiente().siteUrl}/auth/confirmar`,
    tokenDoDesafio(formData),
  );
  if (erro?.startsWith('over_')) {
    return falha(mensagemDeErroAuth(erro));
  }
  // Mesma resposta exista ou não o e-mail.
  return sucesso('Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.');
}

export async function confirmarEmail(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const dados = esquemaConfirmacao.safeParse({
    tokenHash: formData.get('tokenHash'),
    tipo: formData.get('tipo'),
  });
  if (!dados.success) {
    return falha('Link inválido. Peça um novo.');
  }
  const supabase = await criarClienteServidor();
  const erro = await confirmarLink(supabase, dados.data.tokenHash, dados.data.tipo);
  if (erro) {
    return falha(mensagemDeErroAuth(erro === 'desconhecido' ? 'otp_expired' : erro));
  }
  redirect('/definir-senha');
}

export async function definirSenha(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const contexto = await obterUsuarioParcial();
  if (!contexto) {
    redirect('/entrar');
  }
  const dados = esquemaNovaSenha.safeParse({
    senha: formData.get('senha'),
    confirmacao: formData.get('confirmacao'),
  });
  if (!dados.success) {
    return falhaDeValidacao(dados.error);
  }
  const erro = await trocarSenha(contexto.supabase, dados.data.senha);
  if (erro) {
    return falha(mensagemDeErroAuth(erro));
  }
  redirect('/');
}
