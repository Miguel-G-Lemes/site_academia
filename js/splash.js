// Splash screen: aparece uma vez por sessão, fecha sozinha ou ao clicar
(function iniciarSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  if (document.documentElement.classList.contains('sem-splash')) {
    splash.remove();
    return;
  }

  const reduzirMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fechar() {
    splash.classList.add('splash--saindo');
    sessionStorage.setItem('splashVista', '1');
    setTimeout(() => splash.remove(), 600);
  }

  splash.addEventListener('click', fechar);
  setTimeout(fechar, reduzirMovimento ? 500 : 2000);
})();
