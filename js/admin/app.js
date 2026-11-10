/* Painel: login da equipe e navegação entre telas */
const TELAS = {
  painel: renderPainel,
  experimentais: renderExperimentais,
  alunos: renderAlunos,
  estatisticas: renderEstatisticas,
};

const el = (id) => document.getElementById(id);

function irPara(tela) {
  document.querySelectorAll('[data-tela]').forEach((b) => b.classList.toggle('ativo', b.dataset.tela === tela));
  conteudo().innerHTML = 'Carregando...';
  TELAS[tela]().catch(mostrarErro);
}

async function entrar(usuario) {
  const { data } = await sb.from('staff').select('user_id').eq('user_id', usuario.id);
  if (!data || !data.length) {
    await sb.auth.signOut();
    el('entrada').style.display = 'grid';
    el('app').style.display = 'none';
    el('login-erro').textContent = 'Este usuário não tem acesso à equipe.';
    return;
  }
  el('voltar').style.display = 'none';
  el('entrada').style.display = 'none';
  el('app').style.display = 'grid';
  irPara('painel');
}

el('login').onsubmit = async (e) => {
  e.preventDefault();
  el('login-erro').textContent = '';
  const { data, error } = await sb.auth.signInWithPassword({ email: el('email').value, password: el('senha').value });
  if (error) return (el('login-erro').textContent = 'E-mail ou senha incorretos.');
  entrar(data.user);
};

el('sair').onclick = async () => {
  if (!(await confirmarSaida())) return;
  await sb.auth.signOut();
  location.reload();
};

el('data-hoje').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

document.querySelectorAll('[data-tela]').forEach((b) => { b.onclick = () => irPara(b.dataset.tela); });
sb.auth.getSession().then(({ data }) => data.session && entrar(data.session.user));
