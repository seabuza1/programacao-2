import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Informe um e-mail válido.').max(254, 'E-mail longo demais.'));

export const esquemaEntrar = z.object({
  email,
  senha: z.string().min(1, 'Informe a senha.').max(200, 'Senha longa demais.'),
});

export const esquemaCodigo = z.object({
  fatorId: z.uuid(),
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'O código tem 6 dígitos.'),
});

export const esquemaEsqueciSenha = z.object({ email });

export const esquemaNovaSenha = z
  .object({
    senha: z
      .string()
      .min(10, 'Use pelo menos 10 caracteres.')
      .max(200, 'Senha longa demais.')
      .regex(/[A-Za-z]/, 'Use letras e números.')
      .regex(/\d/, 'Use letras e números.'),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem.',
  });

export const esquemaConfirmacao = z.object({
  tokenHash: z.string().min(1).max(500),
  tipo: z.enum(['invite', 'recovery']),
});
