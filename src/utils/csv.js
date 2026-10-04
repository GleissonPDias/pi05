function escapeCell(value) {
  const text = String(value ?? "");
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Baixa um arquivo CSV no navegador.
 * Usa ";" como separador e BOM UTF-8 para o Excel em português abrir
 * os acentos e as colunas corretamente.
 *
 * @param {string} filename  Nome do arquivo (ex.: "clientes.csv")
 * @param {string[]} headers Cabeçalho das colunas
 * @param {Array<Array<string|number>>} rows Linhas de dados
 */
export function downloadCsv(filename, headers, rows) {
  const content = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(";"))
    .join("\r\n");

  // "\uFEFF" = BOM: faz o Excel reconhecer o arquivo como UTF-8 (acentos corretos)
  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
