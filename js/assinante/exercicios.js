/* Biblioteca de exercícios: fotos e vídeos, todos com nome. Só assinantes ativos conseguem ler (regra no banco). */
const BUCKET_EXERCICIOS = 'exercicios';
const exercicios = { lista: [], urls: {} };

// Extrai o código de um link do YouTube (watch, youtu.be, embed ou shorts)
function idYoutube(link) {
  try {
    const url = new URL(link, location.href);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (!url.hostname.includes('youtube.com')) return null;
    if (url.pathname === '/watch') return url.searchParams.get('v');
    const partes = url.pathname.match(/^\/(embed|shorts)\/([\w-]+)/);
    return partes ? partes[2] : null;
  } catch (erro) { return null; }
}

const urlDaMidia = (ex) => (ex.media_path ? exercicios.urls[ex.media_path] : ex.media_url) || '';

function miniaturaHtml(ex, url) {
  if (ex.kind === 'foto') {
    return `<figure class="foto" data-rotulo="${esc(ex.name)}"><img src="${esc(url)}" alt="${esc(ex.name)}" loading="lazy" onerror="semImagem(this)"></figure>`;
  }
  const youtube = idYoutube(url);
  const capa = youtube
    ? `<img src="https://img.youtube.com/vi/${youtube}/hqdefault.jpg" alt="" loading="lazy" onerror="semImagem(this)">`
    : `<video src="${esc(url)}#t=0.5" preload="metadata" muted playsinline></video>`;
  return `<figure class="foto" data-rotulo="${esc(ex.name)}">${capa}<span class="foto__play" aria-hidden="true"><span><svg><use href="#i-play"/></svg></span></span></figure>`;
}

function cartaoExercicioHtml(ex) {
  return `
    <article class="cartao-ex">
      ${miniaturaHtml(ex, urlDaMidia(ex))}
      <div class="cartao-ex__corpo">
        <h3><button type="button" class="cartao-ex__abrir" data-exercicio="${ex.id}" aria-haspopup="dialog">${esc(ex.name)}</button></h3>
        <p>${ex.kind === 'video' ? 'Vídeo' : 'Foto'}${ex.modality_id ? ` · ${MODALIDADES[ex.modality_id]}` : ''}</p>
      </div>
    </article>`;
}

function abrirExercicio(ex) {
  const url = urlDaMidia(ex);
  const youtube = idYoutube(url);
  const midia = ex.kind === 'foto'
    ? `<img src="${esc(url)}" alt="${esc(ex.name)}">`
    : youtube
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${youtube}?rel=0" title="${esc(ex.name)}" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${esc(url)}" controls autoplay playsinline></video>`;

  const { caixa, fechar } = abrirModal(`
    <button type="button" class="modal__fechar" data-fechar aria-label="Fechar">&times;</button>
    <div class="visualizador">
      <div class="visualizador__midia">${midia}</div>
      <div class="visualizador__texto">
        ${ex.modality_id ? `<span class="selo">${MODALIDADES[ex.modality_id]}</span>` : ''}
        <h2>${esc(ex.name)}</h2>
        ${ex.description ? `<p>${esc(ex.description)}</p>` : ''}
        <p class="dica">Em caso de dúvida na execução, peça orientação a um professor.</p>
      </div>
    </div>`, { classe: 'modal--grande', rotulo: ex.name });
  caixa.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fechar(); });
}

function desenharExercicios() {
  const modalidade = campo('ex-modalidade').value;
  const tipo = campo('ex-tipo').value;
  const lista = exercicios.lista.filter((ex) => (!modalidade || ex.modality_id === modalidade) && (!tipo || ex.kind === tipo));
  campo('lista-exercicios').innerHTML = lista.length ? lista.map(cartaoExercicioHtml).join('') : vazioHtml('Nenhum exercício por aqui ainda. Volte em breve: a equipe está montando a biblioteca.');
}

async function carregarExercicios() {
  const { data, error } = await sb.from('exercises').select('*').eq('active', true).order('name');
  if (error) { campo('lista-exercicios').innerHTML = '<p class="aviso">Não foi possível carregar os exercícios. Tente novamente em instantes.</p>'; return; }

  // Arquivos guardados no Storage são privados: pedimos um link temporário para cada um
  const caminhos = data.filter((ex) => ex.media_path).map((ex) => ex.media_path);
  if (caminhos.length) {
    const { data: assinadas } = await sb.storage.from(BUCKET_EXERCICIOS).createSignedUrls(caminhos, 3600);
    (assinadas || []).forEach((a) => { if (a.signedUrl) exercicios.urls[a.path] = a.signedUrl; });
  }
  exercicios.lista = data;
  desenharExercicios();
}

function iniciarExercicios() {
  campo('ex-modalidade').innerHTML = '<option value="">Todas as modalidades</option>' + Object.entries(MODALIDADES).map(([id, nome]) => `<option value="${id}">${nome}</option>`).join('');
  campo('ex-modalidade').addEventListener('change', desenharExercicios);
  campo('ex-tipo').addEventListener('change', desenharExercicios);
  campo('lista-exercicios').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-exercicio]');
    const ex = botao && exercicios.lista.find((item) => item.id === botao.dataset.exercicio);
    if (ex) abrirExercicio(ex);
  });
  return carregarExercicios();
}
