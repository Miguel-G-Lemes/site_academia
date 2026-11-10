/* Itens fixos na tela: botão do WhatsApp e, no celular, barra com "Aula experimental" */
function flutuantesHtml(home, comBarra) {
  const link = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(CONTATO.mensagemWhatsapp)}`;
  return `
    <a class="whatsapp-flutuante" href="${link}" target="_blank" rel="noopener" aria-label="Falar com a gente no WhatsApp">${icone('i-whatsapp')}</a>
    ${comBarra ? `<div class="barra-mobile"><a class="btn btn--bloco" href="${home}#agendar">Aula experimental</a></div>` : ''}`;
}
