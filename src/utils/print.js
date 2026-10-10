import { flushSync } from "react-dom";

/**
 * Imprime um documento (.print-doc) renderizado na hora.
 *
 * Uso: printDocument(setPrinting, valor)
 * 1. renderiza o documento (setPrinting(valor)) imediatamente;
 * 2. espera as imagens (logo) carregarem;
 * 3. abre a impressão do navegador e depois remove o documento.
 *
 * O CSS de impressão (index.css) esconde o resto da tela enquanto o <body>
 * tem a classe "printing-doc".
 */
export async function printDocument(setPrinting, value) {
  flushSync(() => setPrinting(value));
  const images = [...document.querySelectorAll(".print-doc img")];
  await Promise.all(images.map((image) => image.decode?.().catch(() => undefined)));
  document.body.classList.add("printing-doc");
  try {
    window.print();
  } finally {
    document.body.classList.remove("printing-doc");
    setPrinting(null);
  }
}
