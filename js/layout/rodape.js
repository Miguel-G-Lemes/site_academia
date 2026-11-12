/* Rodapé: astronauta, frase, redes em ícones e colunas de links */
function rodapeHtml(home) {
  const rede = (id, nome, url) => `<a href="${url}" target="_blank" rel="noopener" aria-label="${nome}">${icone(id)}</a>`;
  return `
    <div class="container">
      <div class="rodape__grade">
        <div class="rodape__marca">
          <img class="rodape__astronauta" src="assets/astronauta.svg" alt="" width="150" height="150" loading="lazy">
          <p class="rodape__frase">O céu não é o limite. É o aquecimento.</p>
          <div class="rodape__redes">
            ${rede('i-instagram', 'Instagram', CONTATO.redes.instagram)}
            ${rede('i-facebook', 'Facebook', CONTATO.redes.facebook)}
            ${rede('i-whatsapp', 'WhatsApp', `https://wa.me/${CONTATO.whatsapp}`)}
          </div>
        </div>
        <nav aria-label="Navegue">
          <h3>Navegue</h3>
          <ul>
            <li><a href="${home}#modalidades">Modalidades</a></li>
            <li><a href="${home}#diferenciais">Diferenciais</a></li>
            <li><a href="${home}#planos">Planos</a></li>
            <li><a href="nos-conheca.html">Nos conheça</a></li>
          </ul>
        </nav>
        <nav aria-label="Para você">
          <h3>Para você</h3>
          <ul>
            <li><a href="${home}#agendar">Aula experimental</a></li>
            <li><a href="assinar.html">Assinar um plano</a></li>
            <li><a href="aluno.html">Login do aluno</a></li>
            <li><a href="${home}#duvidas">Perguntas frequentes</a></li>
          </ul>
        </nav>
        <div>
          <h3>Contato</h3>
          <ul>
            <li><a href="tel:${CONTATO.telefoneLink}">${CONTATO.telefone}</a></li>
            <li><a href="mailto:${CONTATO.email}">${CONTATO.email}</a></li>
            <li>${CONTATO.endereco}</li>
            ${CONTATO.horarios.map((h) => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="rodape__base">
        <span>© ${new Date().getFullYear()} Academia Marte. Todos os direitos reservados.</span>
        <nav aria-label="Área restrita"><a href="admin.html">Área da equipe</a></nav>
      </div>
    </div>`;
}
