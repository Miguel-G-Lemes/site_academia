/* Painel: aulas experimentais, funil de interessados e conversão em aluno */
const STATUS_AULA = ['agendada', 'confirmada', 'realizada', 'cancelada', 'nao_compareceu'];
const STATUS_FUNIL = ['novo', 'aula_agendada', 'aula_confirmada', 'aula_realizada', 'quer_contratar', 'plano_contratado', 'sem_interesse', 'nao_compareceu'];
const MODALIDADES_EXPERIMENTAIS = Object.keys(MODALIDADES);   // todas aceitam aula experimental

async function renderExperimentais(filtros = {}) {
  let consulta = sb.from('trial_bookings').select('*').order('on_date', { ascending: false });
  if (filtros.status) consulta = consulta.eq('status', filtros.status);
  if (filtros.modalidade) consulta = consulta.eq('modality_id', filtros.modalidade);
  if (filtros.data) consulta = consulta.eq('on_date', filtros.data);

  const { data, error } = await consulta;
  if (error) throw error;

  conteudo().innerHTML = `
    <h2>Aulas experimentais e interessados</h2>
    <div class="barra">
      <select id="f-modalidade">
        <option value="">Todas as modalidades</option>
        ${MODALIDADES_EXPERIMENTAIS.map((id) => `<option value="${id}" ${filtros.modalidade === id ? 'selected' : ''}>${MODALIDADES[id]}</option>`).join('')}
      </select>
      <select id="f-status"><option value="">Todos os status</option>${opcoes(STATUS_AULA, filtros.status)}</select>
      <input id="f-data" type="date" value="${filtros.data || ''}">
      <button class="btn btn--pequeno" id="f-aplicar">Filtrar</button>
    </div>
    <div class="tabela"><table>
      <tr><th>Nome</th><th>Contato</th><th>Modalidade</th><th>Data</th><th>Faixa</th><th>Duração</th><th>Status</th><th>Funil</th><th></th></tr>
      ${data.map((b) => `
        <tr>
          <td>${esc(b.name)}</td>
          <td>${esc(b.phone)}<br>${esc(b.email)}</td>
          <td>${esc(MODALIDADES[b.modality_id])}</td>
          <td>${formatarData(b.on_date)}</td>
          <td>${b.age_group}</td>
          <td>${b.duration_min} min</td>
          <td><select data-id="${b.id}" data-campo="status" aria-label="Status">${opcoes(STATUS_AULA, b.status)}</select></td>
          <td><select data-id="${b.id}" data-campo="lead_status" aria-label="Funil">${opcoes(STATUS_FUNIL, b.lead_status)}</select></td>
          <td>${b.student_id ? '<span class="selo ativo">aluno</span>' : `<button class="btn btn--pequeno" data-converter="${b.id}">Converter em aluno</button>`}</td>
        </tr>`).join('') || linhaVazia(9, 'Nenhuma reserva encontrada. Ajuste os filtros ou aguarde novos interessados.')}
    </table></div>`;

  const filtrar = () => renderExperimentais({
    modalidade: document.getElementById('f-modalidade').value,
    status: document.getElementById('f-status').value,
    data: document.getElementById('f-data').value,
  });
  document.getElementById('f-aplicar').onclick = filtrar;

  document.querySelectorAll('[data-campo]').forEach((select) => {
    select.onchange = async () => {
      const { error: erroAtualizar } = await sb.from('trial_bookings')
        .update({ [select.dataset.campo]: select.value }).eq('id', select.dataset.id);
      aviso(erroAtualizar ? erroAtualizar.message : 'Atualizado', !!erroAtualizar);
    };
  });

  document.querySelectorAll('[data-converter]').forEach((botao) => {
    botao.onclick = () => converterEmAluno(botao.dataset.converter, filtros);
  });
}

async function converterEmAluno(idAgendamento, filtros) {
  const tipo = prompt('Tipo de plano (mensal ou anual):', 'mensal');
  if (!['mensal', 'anual'].includes(tipo)) return aviso('Informe mensal ou anual', true);

  const inicio = prompt('Data de contratação (AAAA-MM-DD):', hoje());
  if (!/^\d{4}-\d\d-\d\d$/.test(inicio || '')) return aviso('Data inválida', true);

  const { error } = await sb.rpc('convert_to_student', { p_booking: idAgendamento, p_kind: tipo, p_start: inicio });
  aviso(error ? error.message : 'Aluno cadastrado', !!error);
  if (!error) renderExperimentais(filtros);
}
