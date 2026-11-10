/* Cabeçalho fixo: logo, menu, login do aluno e aula experimental.
   O conteúdo de .topo__acoes muda conforme quem está logado (veja conta.js). */
function cabecalhoHtml(home, naHome) {
  return `
    <div class="container topo__barra">
      <a class="marca" href="${naHome ? '#' : 'index.html'}">${icone('logo')}Academia Marte</a>
      <div class="topo__acoes">
        <a class="btn btn--ghost btn--aluno" href="aluno.html">${icone('i-user')}<span>Login do aluno</span></a>
        <a class="btn" href="${home}#agendar">Aula experimental</a>
      </div>
      <button class="topo__menu-botao" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu">${icone('i-menu')}</button>
      <ul class="menu" id="menu">
        <li><a href="${home}#modalidades">Modalidades</a></li>
        <li><a href="${home}#diferenciais">Diferenciais</a></li>
        <li><a href="${home}#planos">Planos</a></li>
        <li><a href="nos-conheca.html">Nos conheça</a></li>
        <li><a href="${home}#duvidas">Dúvidas</a></li>
        <li><a href="${home}#contato">Contato</a></li>
      </ul>
    </div>`;
}
