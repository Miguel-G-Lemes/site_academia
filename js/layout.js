/* Monta a estrutura comum das páginas públicas: ícones, cabeçalho, rodapé e itens flutuantes.
   Depende de dados-site.js e de js/layout/*.js */
(function montarLayout() {
  const naHome = !/(nos-conheca|assinar|404)(\.html)?$/.test(location.pathname);
  const home = naHome ? '' : 'index.html';                       // prefixo dos links para as seções da home
  const comBarra = document.body.dataset.semBarra === undefined;  // páginas podem desligar a barra do celular

  document.body.dataset.home = home;                             // conta.js usa para montar os links
  document.getElementById('topo').innerHTML = cabecalhoHtml(home, naHome);
  document.getElementById('rodape').innerHTML = rodapeHtml(home);
  document.body.insertAdjacentHTML('beforeend', flutuantesHtml(home, comBarra));
  if (comBarra) document.body.classList.add('com-barra-mobile');

  // Menu em telas menores: abre e fecha pelo botão e fecha ao escolher um link
  const cabecalho = document.getElementById('topo');
  const botao = cabecalho.querySelector('.topo__menu-botao');
  function alternarMenu(aberto) {
    cabecalho.classList.toggle('topo--aberto', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
  }
  botao.addEventListener('click', () => alternarMenu(!cabecalho.classList.contains('topo--aberto')));
  cabecalho.querySelectorAll('.menu a').forEach((link) => link.addEventListener('click', () => alternarMenu(false)));
})();
