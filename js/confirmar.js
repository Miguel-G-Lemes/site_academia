/* Pop-up de confirmação no centro da tela. Uso: if (await confirmarAcao({ titulo, texto })) { ... }
   Depende de modal.js. */
function confirmarAcao({ titulo, texto, confirmar = 'Confirmar', cancelar = 'Cancelar' }) {
  return new Promise((resolve) => {
    const { caixa, fechar } = abrirModal(`
      <h2>${titulo}</h2>
      <p>${texto}</p>
      <div class="modal__acoes">
        <button type="button" class="btn btn--ghost" data-resposta="nao" autofocus>${cancelar}</button>
        <button type="button" class="btn" data-resposta="sim">${confirmar}</button>
      </div>`, { papel: 'alertdialog', rotulo: titulo, aoFechar: (resposta) => resolve(resposta === true) });

    caixa.addEventListener('click', (evento) => {
      const resposta = evento.target.dataset && evento.target.dataset.resposta;
      if (resposta) fechar(resposta === 'sim');
    });
  });
}

const confirmarSaida = () => confirmarAcao({
  titulo: 'Sair da conta?',
  texto: 'Tem certeza de que deseja sair da sua conta?',
  confirmar: 'Sim, sair',
  cancelar: 'Ficar',
});
