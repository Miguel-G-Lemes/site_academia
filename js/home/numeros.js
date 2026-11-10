/* Faixa de números: sobem de 0 até o valor final quando aparecem na tela */
(function iniciarNumeros() {
  const lista = document.getElementById('lista-numeros');
  if (!lista) return;
  const formatar = (n) => n.toLocaleString('pt-BR');

  lista.innerHTML = NUMEROS.map((n) => `
    <li>
      <span class="numero__valor" data-alvo="${n.valor}" data-prefixo="${n.prefixo}">${n.prefixo}${formatar(n.valor)}</span>
      <span class="numero__rotulo">${n.rotulo}</span>
    </li>`).join('');

  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (semMovimento || !('IntersectionObserver' in window)) return;      // mantém os valores finais

  function animar(el) {
    const alvo = Number(el.dataset.alvo);
    const duracao = 1600;
    const inicio = performance.now();
    (function passo(agora) {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suave = 1 - Math.pow(1 - progresso, 3);
      el.textContent = el.dataset.prefixo + formatar(Math.round(alvo * suave));
      if (progresso < 1) requestAnimationFrame(passo);
    })(inicio);
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      animar(entrada.target);
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.6 });
  lista.querySelectorAll('.numero__valor').forEach((el) => { el.textContent = el.dataset.prefixo + '0'; observador.observe(el); });
})();
