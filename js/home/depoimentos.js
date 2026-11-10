/* Depoimentos: foto (ou iniciais), nome e frase */
(function renderDepoimentos() {
  const lista = document.getElementById('lista-depoimentos');
  if (!lista) return;
  const iniciais = (nome) => nome.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  lista.innerHTML = DEPOIMENTOS.map((d) => `
    <figure class="depoimento">
      <blockquote>“${esc(d.frase)}”</blockquote>
      <figcaption>
        <span class="avatar">${d.foto ? `<img src="${esc(d.foto)}" alt="Foto de ${esc(d.nome)}" loading="lazy">` : iniciais(d.nome)}</span>
        ${esc(d.nome)}
      </figcaption>
    </figure>`).join('');
})();
