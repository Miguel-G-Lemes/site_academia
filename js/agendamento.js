/* Aula experimental em passos: modalidade, dia, horário e dados.
   A reserva usa as mesmas funções do banco de antes (available_slots e book_trial). */
const estado = { modalidades: [], horario: null, pedida: null, dadosConta: null };
const campo = (id) => document.getElementById(id);
const POUCAS_VAGAS = 2;                        // a partir daqui aparece o selo "Poucas vagas"

function mostrarRetorno(texto, tipo) {
  const el = campo('retorno');
  el.textContent = texto || '';
  el.className = tipo ? `retorno retorno--${tipo}` : 'retorno';
}

function modalidadeEscolhida() {
  const marcada = document.querySelector('[name=modalidade]:checked');
  return marcada ? estado.modalidades.find((m) => m.id === marcada.value) : null;
}

// Só natação e hidroginástica dependem da faixa etária
const faixaEtaria = (modalidade) => (modalidade && modalidade.age_rule ? campo('faixa').value : 'adulto');

// Libera cada passo quando o anterior está preenchido
function atualizarPassos() {
  const modalidade = modalidadeEscolhida();
  const liberados = [true, !!modalidade, !!modalidade && !!campo('data').value, !!estado.horario];
  liberados.forEach((liberado, i) => {
    const passo = campo(`passo-${i + 1}`);
    passo.disabled = !liberado;
    passo.classList.remove('passo--ativo');
  });
  campo(`passo-${liberados.lastIndexOf(true) + 1}`).classList.add('passo--ativo');
}

// ---------- Modalidades (vêm do banco) ----------
function aplicarModalidadePedida() {
  if (!estado.pedida) return;
  const opcao = document.querySelector(`[name=modalidade][value="${estado.pedida}"]`);
  if (!opcao) return;
  opcao.checked = true;
  opcao.dispatchEvent(new Event('change', { bubbles: true }));
  estado.pedida = null;
}

// Usada pela janela de detalhe das modalidades
function escolherModalidade(id) {
  estado.pedida = id;
  aplicarModalidadePedida();
}

async function carregarModalidades() {
  const { data, error } = await sb.from('modalities').select('*').eq('trial', true).order('name');
  if (error) return mostrarRetorno('Não foi possível carregar as modalidades. Tente novamente em instantes.', 'erro');
  estado.modalidades = data;
  campo('modalidades-opcoes').innerHTML = data.map((m) => `
    <label class="opcao">
      <input type="radio" name="modalidade" value="${m.id}">
      <span class="opcao__corpo">${m.name}</span>
    </label>`).join('');
  aplicarModalidadePedida();
}

// ---------- Horários ----------
function horarioHtml(h) {
  const lotado = h.spots_left <= 0;
  const poucas = !lotado && h.spots_left <= POUCAS_VAGAS;
  const selo = lotado ? '<em class="selo selo--lotado">Lotado</em>'
    : poucas ? '<em class="selo selo--aviso">Poucas vagas</em>' : '';
  return `
    <label class="opcao">
      <input type="radio" name="horario" value="${h.slot_id}" ${lotado ? 'disabled' : ''}>
      <span class="opcao__corpo"><strong>${h.start_time.slice(0, 5)}</strong><small>${h.duration_min} min</small>${selo}</span>
    </label>`;
}

async function carregarHorarios() {
  estado.horario = null;
  const modalidade = modalidadeEscolhida();
  const data = campo('data').value;
  const caixa = campo('horarios');

  campo('caixa-faixa').hidden = !(modalidade && modalidade.age_rule);
  const faixa = faixaEtaria(modalidade);
  campo('aviso-duracao').textContent = faixa === 'adulto'
    ? 'Adultos têm aula de 60 minutos.'
    : 'Crianças e idosos têm aula de no máximo 45 minutos. Mostramos só horários compatíveis.';
  atualizarPassos();

  if (!modalidade || !data) {
    caixa.innerHTML = '<p class="aviso">Escolha a modalidade e o dia para ver os horários.</p>';
    return;
  }

  const { data: horarios, error } = await sb.rpc('available_slots', { p_modality: modalidade.id, p_date: data, p_age: faixa });
  if (error) {
    caixa.innerHTML = '<p class="aviso">Erro ao consultar horários. Tente novamente.</p>';
    return;
  }
  caixa.innerHTML = horarios.length ? horarios.map(horarioHtml).join('') : '<p class="aviso">Sem horários nesta data. Tente outro dia.</p>';
}

// ---------- Reserva ----------
async function confirmarAgendamento(evento) {
  evento.preventDefault();
  mostrarRetorno();

  const modalidade = modalidadeEscolhida();
  if (!modalidade || !estado.horario) return mostrarRetorno('Escolha modalidade, dia e horário.', 'erro');
  if (!campo('nome').value.trim() || !campo('telefone').value.trim() || !campo('email').validity.valid) {
    return mostrarRetorno('Confira nome, telefone e e-mail.', 'erro');
  }

  campo('confirmar').disabled = true;
  const { data, error } = await sb.rpc('book_trial', {
    p_name: campo('nome').value,
    p_phone: campo('telefone').value,
    p_email: campo('email').value,
    p_slot: estado.horario,
    p_date: campo('data').value,
    p_age: faixaEtaria(modalidade),
    p_notes: campo('observacoes').value || null,
  });

  if (error) {
    mostrarRetorno(error.message, 'erro');
    campo('confirmar').disabled = false;
    carregarHorarios();
    return;
  }

  mostrarRetorno(
    `Aula confirmada: ${data.modality}, ${formatarData(data.date)} às ${data.time.slice(0, 5)} (${data.duration} min). Chegue 10 minutos antes.`,
    'ok'
  );
  campo('formulario').reset();
  campo('horarios').innerHTML = '<p class="aviso">Escolha a modalidade e o dia para ver os horários.</p>';
  campo('caixa-faixa').hidden = true;
  estado.horario = null;
  atualizarPassos();
}

// ---------- Preenchimento automático (quem já está logado) ----------
async function prepararPreenchimento() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  const user = session.user;
  const [aluno, perfil] = await Promise.all([
    sb.from('students').select('name,phone').eq('user_id', user.id).maybeSingle(),
    sb.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ]);
  estado.dadosConta = {
    nome: (aluno.data && aluno.data.name) || (perfil.data && perfil.data.name) || (user.user_metadata && user.user_metadata.name) || '',
    email: user.email,
    telefone: (aluno.data && aluno.data.phone) || '',
  };
  campo('preencher-dados').hidden = false;
}

function preencherComDadosDaConta() {
  const dados = estado.dadosConta;
  if (!dados) return;
  campo('nome').value = dados.nome;
  campo('email').value = dados.email;
  if (dados.telefone) campo('telefone').value = dados.telefone;
  (dados.telefone ? campo('observacoes') : campo('telefone')).focus();
}

function iniciarAgendamento() {
  campo('data').min = hoje();
  campo('modalidades-opcoes').addEventListener('change', carregarHorarios);
  campo('faixa').addEventListener('change', carregarHorarios);
  campo('data').addEventListener('change', carregarHorarios);
  campo('horarios').addEventListener('change', (e) => {
    estado.horario = e.target.value;
    atualizarPassos();
  });
  campo('formulario').addEventListener('submit', confirmarAgendamento);
  campo('preencher-dados').addEventListener('click', preencherComDadosDaConta);
  prepararPreenchimento();
  atualizarPassos();
  carregarModalidades();
}

iniciarAgendamento();
