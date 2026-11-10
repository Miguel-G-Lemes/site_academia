/* Seção Modalidades: grade 3x2 de cartões e janela com o detalhe de cada uma.
   Depende de utils.js (MODALIDADES) e modal.js. */
const CATALOGO = [
  {
    id: 'musculacao', arquivo: 'musculacao.png', posicao: '50% 30%', alt: 'Aluna fazendo agachamento na sala de musculação',
    resumo: 'Força e massa magra com acompanhamento em cada treino.',
    texto: 'Salão amplo com máquinas, pesos livres e orientação de instrutores em cada treino.',
    beneficios: ['Ganho de força e massa magra', 'Fichas individuais, revisadas periodicamente', 'Equipamentos para iniciantes e avançados'],
  },
  {
    id: 'aerobico', arquivo: 'aerobico.png', posicao: '55% 40%', alt: 'Alunos treinando nas esteiras',
    resumo: 'Coração e pulmão em dia, no seu ritmo.',
    texto: 'Esteiras, bicicletas e transportes para treinar coração e pulmão no seu ritmo.',
    beneficios: ['Mais condicionamento e disposição', 'Apoio ao controle de peso', 'Protocolos de baixa a alta intensidade'],
  },
  {
    id: 'natacao', arquivo: 'natacao.jpg', posicao: '35% 45%', alt: 'Crianças em aula de natação com a professora',
    resumo: 'Exercício completo de baixo impacto, por faixa etária.',
    texto: 'Aulas em turmas por faixa etária. Crianças e idosos: até 45 minutos. Adultos: 1 hora.',
    beneficios: ['Exercício completo e de baixo impacto', 'Melhora da respiração e da postura', 'Turmas com limite de vagas'],
  },
  {
    id: 'pilates', arquivo: 'pilates.jpg', posicao: '40% 45%', alt: 'Aluna fazendo exercício de pilates na bola',
    resumo: 'Mobilidade, postura e consciência corporal.',
    texto: 'Aulas guiadas de controle, respiração e alongamento, adaptadas ao seu nível.',
    beneficios: ['Mais mobilidade e consciência corporal', 'Fortalecimento do core', 'Alívio de tensões do dia a dia'],
  },
  {
    id: 'danca', arquivo: 'danca.png', posicao: '60% 35%', alt: 'Turma dançando em aula coletiva',
    resumo: 'Suar sorrindo, com coreografias leves.',
    texto: 'Aulas coletivas com coreografias leves, para suar sorrindo.',
    beneficios: ['Coordenação e ritmo', 'Gasto calórico divertido', 'Turma acolhedora, sem pré-requisito'],
  },
  {
    id: 'hidro', arquivo: 'hidro.png', posicao: '50% 55%', alt: 'Alunos em aula de hidroginástica',
    resumo: 'Resistência e tonificação sem sobrecarregar as articulações.',
    texto: 'Exercícios na água, com 45 minutos para crianças e idosos e 1 hora para adultos.',
    beneficios: ['Proteção para as articulações', 'Resistência e tonificação', 'Ótima para todas as idades'],
  },
];

// Chamada pelo onerror da imagem: sem arquivo de foto, mostra um bloco vermelho e preto com o nome
function semImagem(img) {
  img.parentElement.classList.add('foto--vazia');
  img.remove();
}

const fotoHtml = (m, lazy = true) => `
  <figure class="foto" data-rotulo="${MODALIDADES[m.id]}">
    <img src="assets/${m.arquivo}" style="object-position: ${m.posicao}" alt="${m.alt}" ${lazy ? 'loading="lazy"' : ''} onerror="semImagem(this)">
  </figure>`;

function cartaoHtml(m) {
  return `
    <article class="cartao-mod">
      ${fotoHtml(m)}
      <div class="cartao-mod__corpo">
        <h3><button type="button" class="cartao-mod__abrir" data-modalidade="${m.id}" aria-haspopup="dialog">${MODALIDADES[m.id]}</button></h3>
        <p>${m.resumo}</p>
        <span class="selo">Aula experimental</span>
      </div>
    </article>`;
}

function abrirDetalhe(id) {
  const m = CATALOGO.find((item) => item.id === id);
  const { caixa, fechar } = abrirModal(`
    <button type="button" class="modal__fechar" data-fechar aria-label="Fechar">&times;</button>
    <div class="detalhe-mod">
      ${fotoHtml(m, false)}
      <div class="detalhe-mod__texto">
        <span class="selo">Aula experimental</span>
        <h2>${MODALIDADES[id]}</h2>
        <p>${m.texto}</p>
        <ul>${m.beneficios.map((b) => `<li>${b}</li>`).join('')}</ul>
        <a class="btn" href="#agendar" data-agendar>Agendar aula experimental</a>
      </div>
    </div>`, { classe: 'modal--grande', rotulo: MODALIDADES[id] });

  caixa.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-fechar]')) fechar();
    if (evento.target.closest('[data-agendar]')) {
      fechar();
      if (typeof escolherModalidade === 'function') escolherModalidade(id);   // já marca a modalidade no formulário
    }
  });
}

(function renderModalidades() {
  const lista = document.getElementById('lista-modalidades');
  if (!lista) return;
  lista.innerHTML = CATALOGO.map(cartaoHtml).join('');
  lista.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-modalidade]');
    if (botao) abrirDetalhe(botao.dataset.modalidade);
  });
})();
