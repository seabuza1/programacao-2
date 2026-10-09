import { nomeCurtoDoMes, nomeDoMes, type Mes } from '@/lib/datas';
import { pct, reais, texto, type LinhaTabela, type Tabela } from '@/lib/exportar/tabela';
import type { Gerencial, LinhaAnual, RelatorioAnual } from './service';

export function tabelaGerencial(gerencial: Gerencial, empresa: string, mes: Mes): Tabela {
  const linhas: LinhaTabela[] = [
    { celulas: [texto('Faturamento'), reais(gerencial.faturamento), texto('')], destaque: true },
  ];
  for (const grupo of gerencial.grupos) {
    linhas.push({
      celulas: [texto(grupo.nome), reais(grupo.total), pct(grupo.percentual)],
      destaque: true,
    });
    for (const linha of grupo.contas) {
      linhas.push({
        celulas: [texto(`   ${linha.conta.nome}`), reais(linha.total), pct(linha.percentual)],
      });
    }
  }
  linhas.push(
    {
      celulas: [
        texto('Total de saídas'),
        reais(gerencial.totalSaidas),
        pct(gerencial.percentualSaidas),
      ],
      destaque: true,
    },
    {
      celulas: [texto('Lucro'), reais(gerencial.lucro), pct(gerencial.percentualLucro)],
      destaque: true,
    },
  );
  return {
    titulo: `Relatório gerencial e DRE · ${empresa}`,
    subtitulo: `${nomeDoMes(mes)} · valores em R$`,
    colunas: ['Conta', 'Valor', '% do faturamento'],
    linhas,
  };
}

function linhaAnual(linha: LinhaAnual, destaque = false, recuo = false): LinhaTabela {
  return {
    celulas: [
      texto(recuo ? `   ${linha.nome}` : linha.nome),
      // Mês sem valor fica em branco, como na tela.
      ...linha.meses.map((valor) => (valor === 0 ? texto('') : reais(valor))),
      reais(linha.total),
      reais(linha.media),
      pct(linha.percentual),
    ],
    destaque,
  };
}

export function tabelaAnual(anual: RelatorioAnual, empresa: string, ano: number): Tabela {
  const linhas: LinhaTabela[] = [
    ...anual.entradas.map((l) => linhaAnual(l, false, true)),
    linhaAnual(anual.faturamento, true),
  ];
  for (const grupo of anual.grupos) {
    linhas.push(linhaAnual(grupo, true));
    linhas.push(
      ...anual.saidas.filter((s) => s.grupo === grupo.grupo).map((l) => linhaAnual(l, false, true)),
    );
  }
  linhas.push(linhaAnual(anual.totalSaidas, true), linhaAnual(anual.lucro, true));
  return {
    titulo: `Relatório anual · ${empresa}`,
    subtitulo: `${ano} · meses lançados: ${anual.mesesLancados} · valores em R$`,
    colunas: [
      'Linha',
      ...Array.from({ length: 12 }, (_, i) => nomeCurtoDoMes(i + 1)),
      'Total',
      'Média',
      '%',
    ],
    linhas,
  };
}
