/* Revelar ao rolar: suaviza a entrada dos blocos marcados com data-revelar.
   Respeita prefers-reduced-motion. Carregue por último na página. */
(function revelarAoRolar() {
  const alvos = document.querySelectorAll('[data-revelar]');
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!alvos.length) return;
  if (semMovimento || !('IntersectionObserver' in window)) {
    alvos.forEach((alvo) => alvo.classList.add('revelado'));
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('revelado');
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  alvos.forEach((alvo) => observador.observe(alvo));
})();
