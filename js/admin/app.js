/* Painel: login da equipe e navegação entre telas */
const TELAS = {
  painel: renderPainel,
  experimentais: renderExperimentais,
  alunos: renderAlunos,
  estatisticas: renderEstatisticas,
  exercicios: renderExercicios,
};

const el = (id) => document.getElementById(id);

let telaAtual = 'painel';

function irPara(tela) {
  telaAtual = tela;
  document.querySelectorAll('[data-tela]').forEach((b) => b.classList.toggle('ativo', b.dataset.tela === tela));
  conteudo().innerHTML = 'Carregando...';
  TELAS[tela]().catch(mostrarErro);
}

// Atualiza a tela aberta (mantendo os filtros) quando chega uma reserva nova
function atualizarTelaAtual() {
  if (telaAtual === 'painel') return renderPainel().catch(mostrarErro);
  if (telaAtual === 'experimentais') {
    return renderExperimentais({
      modalidade: (el('f-modalidade') || {}).value,
      status: (el('f-status') || {}).value,
      data: (el('f-data') || {}).value,
    }).catch(mostrarErro);
  }
}

// Reservas de aula experimental aparecem na hora, sem recarregar (Supabase Realtime)
function iniciarTempoReal() {
  sb.channel('novas-reservas')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trial_bookings' }, (evento) => {
      aviso(`Nova aula experimental agendada: ${evento.new.name}`);
      atualizarTelaAtual();
    })
    .subscribe();
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
  iniciarTempoReal();
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
