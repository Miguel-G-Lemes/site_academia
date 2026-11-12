/* Painel: biblioteca de exercícios (fotos e vídeos com nome) que os assinantes veem na área deles */
const BUCKET_EXERCICIOS = 'exercicios';
const TIPOS_ARQUIVO = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
const LIMITE_ARQUIVO = 50 * 1024 * 1024;     // 50 MB, o mesmo limite do bucket

const novoIdDeArquivo = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

async function renderExercicios() {
  const { data, error } = await sb.from('exercises').select('*').order('name');
  if (error) throw error;

  const linhas = data.map((ex) => `
    <tr>
      <td>${esc(ex.name)}</td>
      <td>${ex.modality_id ? esc(MODALIDADES[ex.modality_id]) : 'Todas'}</td>
      <td>${ex.kind === 'video' ? 'Vídeo' : 'Foto'}</td>
      <td>${ex.media_path ? 'Arquivo enviado' : 'Link'}</td>
      <td><span class="selo ${ex.active ? 'ativo' : ''}">${ex.active ? 'visível' : 'oculto'}</span></td>
      <td>
        <button class="btn btn--ghost btn--pequeno" data-alternar="${ex.id}">${ex.active ? 'Ocultar' : 'Mostrar'}</button>
        <button class="btn btn--ghost btn--pequeno" data-excluir="${ex.id}">Excluir</button>
      </td>
    </tr>`).join('');

  conteudo().innerHTML = `
    <h2>Exercícios</h2>
    <p class="card__nota">Cadastre fotos e vídeos, sempre com nome. Assinantes com plano ativo veem esta biblioteca na área deles.</p>
    <form class="barra" id="novo-exercicio">
      <input id="ex-nome" placeholder="Nome do exercício" required maxlength="80">
      <select id="ex-modalidade-admin" aria-label="Modalidade">
        <option value="">Todas as modalidades</option>
        ${Object.entries(MODALIDADES).map(([id, nome]) => `<option value="${id}">${nome}</option>`).join('')}
      </select>
      <select id="ex-origem" aria-label="Origem da mídia"><option value="arquivo">Enviar arquivo</option><option value="link">Usar link</option></select>
      <input id="ex-arquivo" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm">
      <select id="ex-tipo-admin" aria-label="Tipo do link" hidden><option value="foto">Link de foto</option><option value="video">Link de vídeo (YouTube ou arquivo)</option></select>
      <input id="ex-link" type="url" placeholder="https://..." hidden>
      <input id="ex-descricao" placeholder="Descrição curta (opcional)" maxlength="240">
      <button class="btn btn--pequeno">Adicionar</button>
    </form>
    <div class="tabela"><table>
      <tr><th>Nome</th><th>Modalidade</th><th>Tipo</th><th>Origem</th><th>Situação</th><th></th></tr>
      ${linhas || linhaVazia(6, 'Nenhum exercício cadastrado. Que tal subir o primeiro treino?')}
    </table></div>`;

  const recarregar = () => renderExercicios().catch(mostrarErro);
  el('ex-origem').onchange = () => {
    const link = el('ex-origem').value === 'link';
    el('ex-arquivo').hidden = link;
    el('ex-link').hidden = !link;
    el('ex-tipo-admin').hidden = !link;
  };
  el('novo-exercicio').onsubmit = (evento) => adicionarExercicio(evento, recarregar);

  document.querySelectorAll('[data-alternar]').forEach((botao) => {
    botao.onclick = async () => {
      const ex = data.find((item) => item.id === botao.dataset.alternar);
      const { error: erroAtualizar } = await sb.from('exercises').update({ active: !ex.active }).eq('id', ex.id);
      aviso(erroAtualizar ? erroAtualizar.message : 'Atualizado', !!erroAtualizar);
      recarregar();
    };
  });
  document.querySelectorAll('[data-excluir]').forEach((botao) => {
    botao.onclick = async () => {
      const ex = data.find((item) => item.id === botao.dataset.excluir);
      const confirmado = await confirmarAcao({ titulo: 'Excluir exercício?', texto: `"${esc(ex.name)}" sai da biblioteca dos assinantes.`, confirmar: 'Excluir', cancelar: 'Voltar' });
      if (!confirmado) return;
      const { error: erroExcluir } = await sb.from('exercises').delete().eq('id', ex.id);
      if (!erroExcluir && ex.media_path) await sb.storage.from(BUCKET_EXERCICIOS).remove([ex.media_path]);
      aviso(erroExcluir ? erroExcluir.message : 'Exercício excluído', !!erroExcluir);
      recarregar();
    };
  });
}

async function adicionarExercicio(evento, recarregar) {
  evento.preventDefault();
  const registro = {
    name: el('ex-nome').value.trim(),
    modality_id: el('ex-modalidade-admin').value || null,
    description: el('ex-descricao').value.trim() || null,
  };

  if (el('ex-origem').value === 'arquivo') {
    const arquivo = el('ex-arquivo').files[0];
    if (!arquivo) return aviso('Escolha um arquivo de foto ou vídeo.', true);
    if (!TIPOS_ARQUIVO.includes(arquivo.type)) return aviso('Use arquivos JPG, PNG, WEBP, MP4 ou WEBM.', true);
    if (arquivo.size > LIMITE_ARQUIVO) return aviso('O arquivo passa de 50 MB.', true);

    const extensao = arquivo.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const caminho = `${novoIdDeArquivo()}.${extensao}`;
    aviso('Enviando arquivo...');
    const envio = await sb.storage.from(BUCKET_EXERCICIOS).upload(caminho, arquivo, { contentType: arquivo.type });
    if (envio.error) return aviso(envio.error.message, true);
    registro.media_path = caminho;
    registro.kind = arquivo.type.startsWith('video') ? 'video' : 'foto';
  } else {
    const link = el('ex-link').value.trim();
    if (!/^https?:\/\//i.test(link)) return aviso('Informe um link começando com http:// ou https://', true);
    registro.media_url = link;
    registro.kind = el('ex-tipo-admin').value;
  }

  const { error } = await sb.from('exercises').insert(registro);
  if (error) {
    if (registro.media_path) await sb.storage.from(BUCKET_EXERCICIOS).remove([registro.media_path]);   // não deixa arquivo órfão
    return aviso(error.message, true);
  }
  aviso('Exercício adicionado');
  recarregar();
}
