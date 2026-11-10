/* Perguntas frequentes em sanfona (elemento details, acessível por teclado) */
(function renderFaq() {
  const lista = document.getElementById('lista-faq');
  if (!lista) return;
  lista.innerHTML = PERGUNTAS.map((p) => `
    <details class="faq__item">
      <summary>${esc(p.pergunta)}</summary>
      <p>${esc(p.resposta)}</p>
    </details>`).join('');
})();
