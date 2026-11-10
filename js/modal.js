/* Janela (modal) acessível e reutilizável: fundo desfocado, Esc e clique fora fecham, foco preso dentro.
   Uso: const { caixa, fechar } = abrirModal('<h2>...</h2>', { classe, rotulo, papel, aoFechar }); */
function abrirModal(conteudoHtml, { classe = '', rotulo = '', papel = 'dialog', aoFechar } = {}) {
  const focoAnterior = document.activeElement;
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `<div class="modal ${classe}" role="${papel}" aria-modal="true" aria-label="${rotulo}">${conteudoHtml}</div>`;
  const caixa = fundo.firstElementChild;

  function fechar(resultado) {
    document.removeEventListener('keydown', aoTeclar);
    document.body.classList.remove('sem-rolagem');
    fundo.remove();
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    if (aoFechar) aoFechar(resultado);
  }

  // Esc fecha; Tab fica preso dentro da janela
  function aoTeclar(evento) {
    if (evento.key === 'Escape') return fechar();
    if (evento.key !== 'Tab') return;
    const focaveis = caixa.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea');
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  }

  fundo.addEventListener('mousedown', (evento) => { if (evento.target === fundo) fechar(); });
  document.addEventListener('keydown', aoTeclar);
  document.body.append(fundo);
  document.body.classList.add('sem-rolagem');

  const foco = caixa.querySelector('[autofocus]') || caixa.querySelector('button, input, a[href]');
  if (foco) foco.focus();
  return { caixa, fechar };
}
