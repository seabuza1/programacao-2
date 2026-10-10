import 'server-only';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { celulaComoTexto, type Tabela } from './tabela';

const A4_RETRATO: [number, number] = [595.28, 841.89];
const A4_PAISAGEM: [number, number] = [841.89, 595.28];
const MARGEM = 32;
const CORPO_MAXIMO = 8;
const CORPO_MINIMO = 5.5;

/** As fontes padrão do PDF usam WinAnsi: troca o que não existe nela. */
function paraWinAnsi(texto: string): string {
  return texto
    .replace(/\u2192/g, '->')
    .replace(/\u2212/g, '-')
    .replace(/[^\u0000-\u00ff\u2013\u2014\u2018-\u201d\u2022\u2026\u20ac]/g, '?');
}

function caber(texto: string, fonte: PDFFont, tamanho: number, largura: number): string {
  let saida = paraWinAnsi(texto);
  while (saida.length > 1 && fonte.widthOfTextAtSize(saida, tamanho) > largura) {
    saida = `${saida.slice(0, -2)}…`;
  }
  return saida;
}

export async function gerarPdf(tabela: Tabela): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(paraWinAnsi(tabela.titulo));
  pdf.setProducer('Gestão Fácil');
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Tabela estreita em retrato; larga em paisagem.
  const formato = tabela.colunas.length <= 4 ? A4_RETRATO : A4_PAISAGEM;
  const [largura, altura] = formato;
  const util = largura - 2 * MARGEM;
  const textos = tabela.linhas.map((l) => l.celulas.map((c) => paraWinAnsi(celulaComoTexto(c))));
  const larguraMaxima = (coluna: number, tamanho: number) =>
    Math.max(
      negrito.widthOfTextAtSize(paraWinAnsi(tabela.colunas[coluna] ?? ''), tamanho),
      ...textos.map((t) => negrito.widthOfTextAtSize(t[coluna] ?? '', tamanho)),
    ) + 8;

  // Diminui a fonte até os números caberem (o nome da linha pode ser abreviado).
  let CORPO = CORPO_MAXIMO;
  let larguras: number[] = [];
  for (; CORPO >= CORPO_MINIMO; CORPO -= 0.5) {
    const numeros = tabela.colunas.slice(1).map((_, i) => larguraMaxima(i + 1, CORPO));
    const primeira = Math.min(larguraMaxima(0, CORPO), util * 0.4);
    if (primeira + numeros.reduce((t, l) => t + l, 0) <= util || CORPO - 0.5 < CORPO_MINIMO) {
      const sobra = util - primeira - numeros.reduce((t, l) => t + l, 0);
      larguras = [primeira + Math.max(sobra, 0), ...numeros];
      break;
    }
  }
  const LINHA = CORPO * 1.9;
  const xDe = (i: number) => MARGEM + larguras.slice(0, i).reduce((t, l) => t + l, 0);

  let pagina: PDFPage = pdf.addPage(formato);
  let y = altura - MARGEM;

  const escrever = (texto: string, i: number, fonte: PDFFont, alinharDireita: boolean) => {
    const conteudo = caber(texto, fonte, CORPO, (larguras[i] ?? 0) - 6);
    const w = fonte.widthOfTextAtSize(conteudo, CORPO);
    const x = alinharDireita ? xDe(i) + (larguras[i] ?? 0) - 3 - w : xDe(i) + 3;
    pagina.drawText(conteudo, { x, y, size: CORPO, font: fonte, color: rgb(0.1, 0.12, 0.11) });
  };

  const cabecalho = () => {
    pagina.drawRectangle({
      x: MARGEM,
      y: y - 4,
      width: util,
      height: LINHA,
      color: rgb(0.93, 0.94, 0.93),
    });
    tabela.colunas.forEach((nome, i) => escrever(nome, i, negrito, i > 0));
    y -= LINHA;
  };

  pagina.drawText(paraWinAnsi(tabela.titulo), { x: MARGEM, y, size: 14, font: negrito });
  y -= 18;
  pagina.drawText(paraWinAnsi(tabela.subtitulo), { x: MARGEM, y, size: 9, font: normal });
  y -= 22;
  cabecalho();

  for (const linha of tabela.linhas) {
    if (y < MARGEM + LINHA) {
      pagina = pdf.addPage(formato);
      y = altura - MARGEM;
      cabecalho();
    }
    linha.celulas.forEach((c, i) =>
      escrever(celulaComoTexto(c), i, linha.destaque ? negrito : normal, c.tipo !== 'texto'),
    );
    pagina.drawLine({
      start: { x: MARGEM, y: y - 4 },
      end: { x: MARGEM + util, y: y - 4 },
      thickness: 0.3,
      color: rgb(0.85, 0.87, 0.85),
    });
    y -= LINHA;
  }

  const total = pdf.getPageCount();
  pdf.getPages().forEach((p, i) =>
    p.drawText(`Página ${i + 1} de ${total}`, {
      x: largura - MARGEM - 70,
      y: MARGEM / 2,
      size: 7,
      font: normal,
      color: rgb(0.4, 0.4, 0.4),
    }),
  );
  return pdf.save();
}
