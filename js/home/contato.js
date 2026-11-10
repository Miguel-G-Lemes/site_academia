/* Preenche a seção de contato com os dados de dados-site.js */
(function renderContato() {
  const lista = document.getElementById('lista-contato');
  if (!lista) return;
  lista.innerHTML = `
    <li><a href="tel:${CONTATO.telefoneLink}">${CONTATO.telefone}</a></li>
    <li><a href="mailto:${CONTATO.email}">${CONTATO.email}</a></li>
    <li>${CONTATO.endereco}</li>
    ${CONTATO.horarios.map((h) => `<li>${h}</li>`).join('')}`;
})();
