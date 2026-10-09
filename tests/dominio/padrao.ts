import type { Conta, Forma } from '@/features/cadastros';
import type { Entrada } from '@/features/caixa-diario';
import type { Movimentacao } from '@/features/fluxo-caixa';
import { centavos, type Centavos } from '@/lib/money';

/** Formas e contas padrão (docs/dominio.md, seção 3), com ids legíveis. */

function forma(id: string, nome: string, destino: Forma['destino'], ordem: number): Forma {
  return {
    id,
    nome,
    destino,
    ordem,
    contaFaturamento: true,
    ehCrediario: id === 'crediario',
    padrao: true,
    ativa: true,
  };
}

export const FORMAS: Forma[] = [
  forma('dinheiro', 'Dinheiro', 'dinheiro', 10),
  forma('debito', 'Cartão Débito', 'cartao_debito', 20),
  forma('credito', 'Cartão Crédito', 'cartao_credito', 30),
  forma('pix', 'Pix', 'banco', 40),
  forma('crediario', 'Crediário Próprio (carnê)', 'nenhum', 50),
  forma('boleto', 'Boletos Bancários', 'banco', 60),
  forma('brindes', 'Brindes', 'nenhum', 70),
  forma('permutas', 'Permutas', 'nenhum', 80),
];

function conta(id: string, grupo: Conta['grupo'], nome: string, ordem: number): Conta {
  return {
    id,
    grupo,
    nome,
    ordem,
    padrao: true,
    ehProLabore: id === 'pro_labore',
    ehDespesaFinanceira: id === 'financeiras',
    ativa: true,
  };
}

export const CONTAS: Conta[] = [
  conta('aluguel', 'fixo', 'Aluguel', 10),
  conta('pro_labore', 'fixo', 'Pró-labore dos sócios', 30),
  conta('fgts', 'fixo', 'FGTS + INSS + encargos', 50),
  conta('mercadorias', 'variavel', 'Matéria-prima / mercadorias para venda', 10),
  conta('impostos', 'variavel', 'Impostos + tributos', 20),
  conta('financeiras', 'variavel', 'Despesas financeiras', 30),
  conta('marketing', 'variavel', 'Marketing / propagandas', 70),
  conta('maquinas', 'investimento', 'Aquisição de máquinas e equipamentos', 10),
];

/** Reais escritos como no domínio: r(8750) = R$ 8.750,00; r(1588.27) = R$ 1.588,27. */
export function r(reais: number): Centavos {
  return centavos(Math.round(reais * 100));
}

export function entrada(data: string, formaId: string, reais: number): Entrada {
  return { data, formaId, valor: r(reais) };
}

let sequencia = 0;

export function saida(data: string, contaId: string, reais: number): Movimentacao {
  sequencia += 1;
  return {
    id: `saida-${sequencia}`,
    data,
    descricao: '',
    tipo: 'saida',
    caixa: 'banco',
    valor: r(reais),
    contaId,
    origem: null,
  };
}
