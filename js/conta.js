/* Cabeçalho do site conforme quem está logado:
   visitante  -> botão "Login do aluno"
   aluno      -> só o nome, com menu (Configurações, Ajuda, Sair)
   funcionário-> botão "Painel da equipe" (as páginas do site continuam acessíveis) */
const home = document.body.dataset.home || '';
const naHome = home === '';
const primeiroNome = (nome) => String(nome).trim().split(/\s+/)[0];
const iconeSvg = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

// ---------- Ajuda: leva ao telefone e ao e-mail de contato e mostra o aviso ----------
function mostrarAjuda() {
  const aviso = document.getElementById('ajuda-contato');
  const contato = document.getElementById('contato');
  if (!aviso || !contato) return;
  aviso.hidden = false;
  contato.scrollIntoView({ behavior: 'smooth' });
}

function pedirAjuda() {
  if (naHome) mostrarAjuda();
  else location.href = 'index.html?ajuda=1#contato';
}

// ---------- Configurações: nome e senha ----------
function abrirConfiguracoes(user, nomeAtual, aoSalvar) {
  const { caixa, fechar } = abrirModal(`
    <h2>Configurações</h2>
    <form id="cfg-form">
      <label class="modal__campo">Nome<input id="cfg-nome" value="${esc(nomeAtual)}" required autofocus></label>
      <label class="modal__campo">E-mail<input value="${esc(user.email)}" disabled></label>
      <label class="modal__campo">Nova senha (opcional)<input id="cfg-senha" type="password" minlength="6" autocomplete="new-password"></label>
      <p class="modal__retorno" id="cfg-retorno" role="status"></p>
      <div class="modal__acoes">
        <button type="button" class="btn btn--ghost" data-fechar>Fechar</button>
        <button class="btn">Salvar</button>
      </div>
    </form>`, { rotulo: 'Configurações' });

  const retorno = (texto) => { caixa.querySelector('#cfg-retorno').textContent = texto; };
  caixa.addEventListener('click', (e) => { if (e.target.dataset.fechar !== undefined) fechar(); });
  caixa.querySelector('#cfg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = caixa.querySelector('#cfg-nome').value.trim();
    const senha = caixa.querySelector('#cfg-senha').value;
    if (nome.length < 2) return retorno('Informe seu nome.');
    if (senha && senha.length < 6) return retorno('A nova senha precisa ter ao menos 6 caracteres.');

    const alteracoes = { data: { name: nome } };
    if (senha) alteracoes.password = senha;
    const { error } = await sb.auth.updateUser(alteracoes);
    if (error) return retorno(error.message);
    await sb.from('profiles').update({ name: nome }).eq('id', user.id);

    aoSalvar(nome);
    retorno('Alterações salvas.');
    caixa.querySelector('#cfg-senha').value = '';
  });
}

// ---------- Aluno: só o nome, com menu ----------
function montarAluno(acoes, user, nomeCompleto, assinante) {
  let nomeAtual = nomeCompleto;
  acoes.innerHTML = `
    <div class="conta">
      <button class="conta__botao" type="button" aria-haspopup="menu" aria-expanded="false">
        ${iconeSvg('i-user')}<span>${esc(primeiroNome(nomeAtual))}</span>${iconeSvg('i-chevron')}
      </button>
      <ul class="conta__menu" role="menu" hidden>
        ${assinante ? '<li><a role="menuitem" href="assinante.html">Área do assinante</a></li>' : ''}
        <li><button type="button" role="menuitem" data-acao="configuracoes">Configurações</button></li>
        <li><button type="button" role="menuitem" data-acao="ajuda">Ajuda</button></li>
        <li><button type="button" role="menuitem" data-acao="sair">Sair</button></li>
      </ul>
    </div>`;

  const botao = acoes.querySelector('.conta__botao');
  const menu = acoes.querySelector('.conta__menu');
  const alternar = (aberto) => { menu.hidden = !aberto; botao.setAttribute('aria-expanded', String(aberto)); };

  botao.addEventListener('click', () => alternar(menu.hidden));
  document.addEventListener('click', (e) => { if (!acoes.contains(e.target)) alternar(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternar(false); });

  menu.addEventListener('click', async (e) => {
    const acao = e.target.dataset.acao;
    if (!acao) return;
    alternar(false);
    if (acao === 'ajuda') return pedirAjuda();
    if (acao === 'configuracoes') {
      return abrirConfiguracoes(user, nomeAtual, (novo) => {
        nomeAtual = novo;
        botao.querySelector('span').textContent = primeiroNome(novo);
      });
    }
    if (acao === 'sair' && (await confirmarSaida())) {
      await sb.auth.signOut();
      location.reload();
    }
  });
}

// ---------- Funcionário: atalho para a área exclusiva ----------
function montarEquipe(acoes) {
  acoes.innerHTML = `
    <a class="btn btn--aluno" href="admin.html">${iconeSvg('i-dashboard')}<span>Painel da equipe</span></a>
    <a class="btn" href="${home}#agendar">Aula experimental</a>`;
}

(async function iniciarConta() {
  if (new URLSearchParams(location.search).has('ajuda')) mostrarAjuda();

  const acoes = document.querySelector('#topo .topo__acoes');
  if (!acoes || typeof sb === 'undefined') return;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;                                    // visitante: mantém o botão de login
  const user = session.user;

  const [equipe, perfil] = await Promise.all([
    sb.from('staff').select('user_id').eq('user_id', user.id).maybeSingle(),
    sb.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ]);
  if (equipe.data) return montarEquipe(acoes);

  const nome = (perfil.data && perfil.data.name) || (user.user_metadata && user.user_metadata.name) || user.email.split('@')[0];
  const { data: planos } = await sb.from('student_plans').select('id').eq('status', 'ativo').gte('end_date', hoje()).limit(1);
  montarAluno(acoes, user, nome, !!(planos && planos.length));
})();
