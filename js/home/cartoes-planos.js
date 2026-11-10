/* Cartões de planos: benefícios, selo "Mais escolhido" e quanto o plano equivale por mês */
(function renderPlanos() {
  const lista = document.getElementById('lista-planos');
  if (!lista) return;

  lista.innerHTML = Object.entries(PLANOS).map(([id, p]) => {
    const economia = PLANOS.mensal.preco * p.meses - p.preco;
    const equivale = p.meses > 1 ? `<p class="plano__equivale">Equivale a ${formatarPreco(p.preco / p.meses)}/mês${economia > 0 ? ` · economia de ${formatarPreco(economia)} no ano` : ''}</p>` : '';
    return `
      <article class="cartao-plano ${p.destaque ? 'cartao-plano--destaque' : ''}">
        ${p.destaque ? '<span class="selo selo--destaque">Mais escolhido</span>' : ''}
        <h3>${p.nome}</h3>
        <div class="plano__preco">${formatarPreco(p.preco)}<small>${p.periodo}</small></div>
        ${equivale}
        <p class="plano__descricao">${p.descricao}</p>
        <ul class="plano__beneficios">${p.beneficios.map((b) => `<li>${icone('i-check')}${b}</li>`).join('')}</ul>
        <a class="btn ${p.destaque ? '' : 'btn--ghost'} btn--grande" href="assinar.html?plano=${id}">Assinar plano ${p.nome.toLowerCase()}</a>
      </article>`;
  }).join('');
})();
