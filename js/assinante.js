/* Área do assinante: confere o acesso e liga presença, tempo, timer e exercícios.
   Depende de js/assinante/*.js, utils.js, modal.js e layout.js. */
const campo = (id) => document.getElementById(id);
const area = { visitas: [], alunoId: null };

async function carregarVisitas() {
  const inicioDoAno = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data, error } = await sb.from('attendance').select('id,check_in,check_out')
    .eq('student_id', area.alunoId).gte('check_in', inicioDoAno).order('check_in', { ascending: false });
  if (!error) area.visitas = data;
}

function desenharPresencaETempo() {
  renderPresenca(area.visitas);
  renderTempo(area.visitas);
}

async function atualizarVisitas() {
  await carregarVisitas();
  desenharPresencaETempo();
}

async function iniciarAssinante() {
  const acesso = await verificarAcesso();
  campo('assinante-carregando').hidden = true;
  if (acesso.estado !== 'ok') return mostrarBloqueio(acesso.estado);

  area.alunoId = acesso.aluno.id;
  campo('assinante-saudacao').textContent = `Olá, ${acesso.aluno.name.split(/\s+/)[0]}. Seu plano vai até ${formatarData(acesso.plano.end_date)}.`;
  campo('assinante-conteudo').hidden = false;

  iniciarPresenca(atualizarVisitas);
  iniciarTimer();
  await Promise.all([atualizarVisitas(), iniciarExercicios()]);
  setInterval(desenharPresencaETempo, 30000);       // mantém o tempo "até agora" em dia sem recarregar
}

iniciarAssinante();
