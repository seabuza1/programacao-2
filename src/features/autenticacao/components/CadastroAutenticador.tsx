'use client';

import { useActionState } from 'react';
import { BotaoEnviar, Aviso } from '@/lib/ui';
import { cadastrarAutenticador, type ResultadoCadastro } from '../actions';
import { FormCodigo } from './FormCodigo';

const INICIAL: ResultadoCadastro = { ok: true };

export function CadastroAutenticador({ proximo }: { proximo?: string | null }) {
  const [resultado, acao] = useActionState(cadastrarAutenticador, INICIAL);
  if (resultado.ok && resultado.fator) {
    const { fator } = resultado;
    return (
      <div className="pilha">
        <p>
          Abra o app autenticador (Google Authenticator, Microsoft Authenticator ou similar) e leia
          o QR code. Depois digite o código de 6 dígitos que aparecer.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- QR em data: URI gerado pelo Supabase */}
        <img className="qr" src={fator.qrCode} alt="QR code para o app autenticador" />
        <details>
          <summary>Não consigo ler o QR code</summary>
          <p>
            Digite esta chave no app: <code className="segredo">{fator.segredo}</code>
          </p>
        </details>
        <FormCodigo fatorId={fator.id} proximo={proximo ?? null} />
      </div>
    );
  }
  return (
    <form action={acao} className="formulario">
      <Aviso resultado={resultado} />
      <p>Seu acesso exige um segundo fator. Você vai precisar de um app autenticador no celular.</p>
      <BotaoEnviar>Configurar app autenticador</BotaoEnviar>
    </form>
  );
}
