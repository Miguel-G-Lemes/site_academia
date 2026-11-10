/* Painel: alunos, presença do dia, plano e entrada/saída */
function fimDoPlano(inicio, tipo) {
  const data = new Date(`${inicio}T12:00`);
  if (tipo === 'anual') data.setFullYear(data.getFullYear() + 1);
  else data.setMonth(data.getMonth() + 1);
  return data.toLocaleDateString('sv-SE');
}

async function renderAlunos(filtros = { busca: '', presenca: '' }) {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  // O filtro em attendance.check_in traz só as presenças de hoje de cada aluno
  const { data, error } = await sb.from('students')
    .select('*, student_plans(id,kind,modality_ids,start_date,end_date,status), attendance(id,check_in,check_out)')
    .gte('attendance.check_in', inicioHoje.toISOString())
    .order('name');
  if (error) throw error;

  const lista = data
    .filter((a) => a.name.toLowerCase().includes(filtros.busca.toLowerCase()))
    .filter((a) => !filtros.presenca || (filtros.presenca === 'presente') === a.attendance.length > 0);

  const linhas = lista.map((aluno) => {
    const plano = planoAtual(aluno.student_plans);
    const situacao = situacaoPlano(plano);
    const modalidades = plano ? plano.modality_ids.map((id) => MODALIDADES[id]).join(', ') : '-';
    const presencas = aluno.attendance.slice().sort((a, b) => a.check_in.localeCompare(b.check_in));
    const entradaAberta = presencas.find((p) => !p.check_out);

    const presenca = presencas.length
      ? `<span class="selo selo--ok">Veio · ${formatarHora(presencas[0].check_in)}</span>`
      : '<span class="selo">Não veio</span>';
    const botaoPresenca = entradaAberta
      ? `<button class="btn btn--ghost btn--pequeno" data-saida="${entradaAberta.id}">Registrar saída</button>`
      : `<button class="btn btn--ghost btn--pequeno" data-entrada="${aluno.id}">Registrar entrada</button>`;
    const botaoCancelar = plano && plano.status === 'ativo'
      ? `<button class="btn btn--ghost btn--pequeno" data-cancelar="${plano.id}">Cancelar plano</button>` : '';

    return `
      <tr>
        <td>${esc(aluno.name)}</td><td>${esc(aluno.phone || '')}</td><td>${esc(modalidades)}</td>
        <td>${plano ? plano.kind : '-'}</td><td>${formatarData(plano?.end_date)}</td>
        <td><span class="selo ${situacao.classe}">${situacao.texto}</span></td>
        <td>${presenca}</td><td>${botaoPresenca} ${botaoCancelar}</td>
      </tr>`;
  }).join('');

  conteudo().innerHTML = `
    <h2>Alunos</h2>
    <div class="barra">
      <input id="busca" placeholder="Buscar por nome" value="${esc(filtros.busca)}">
      <select id="filtro-presenca">
        <option value="">Presença de hoje: todos</option>
        <option value="presente" ${filtros.presenca === 'presente' ? 'selected' : ''}>Vieram hoje</option>
        <option value="ausente" ${filtros.presenca === 'ausente' ? 'selected' : ''}>Não vieram hoje</option>
      </select>
      <button class="btn btn--pequeno" id="buscar">Filtrar</button>
    </div>
    <form class="barra" id="novo-aluno">
      <input id="n-nome" placeholder="Nome" required>
      <input id="n-telefone" placeholder="Telefone">
      <input id="n-email" type="email" placeholder="E-mail">
      <select id="n-tipo"><option>mensal</option><option>anual</option></select>
      <input id="n-inicio" type="date" value="${hoje()}" required>
      ${Object.entries(MODALIDADES).map(([id, nome]) => `<label class="opcao"><input type="checkbox" name="modalidade" value="${id}"><span class="opcao__corpo">${nome}</span></label>`).join('')}
      <button class="btn btn--pequeno">Cadastrar aluno</button>
    </form>
    <div class="tabela"><table>
      <tr><th>Nome</th><th>Telefone</th><th>Modalidades</th><th>Plano</th><th>Vencimento</th><th>Situação</th><th>Hoje</th><th>Ações</th></tr>
      ${linhas || linhaVazia(8, 'Nenhum aluno por aqui. Hora da primeira decolagem.')}
    </table></div>`;

  const recarregar = () => renderAlunos({
    busca: document.getElementById('busca').value,
    presenca: document.getElementById('filtro-presenca').value,
  });
  document.getElementById('buscar').onclick = recarregar;
  document.getElementById('novo-aluno').onsubmit = (e) => cadastrarAluno(e, recarregar);

  document.querySelectorAll('[data-entrada]').forEach((b) => {
    b.onclick = async () => {
      const { error: e } = await sb.from('attendance').insert({ student_id: b.dataset.entrada });
      aviso(e ? e.message : 'Entrada registrada', !!e);
      recarregar();
    };
  });
  document.querySelectorAll('[data-saida]').forEach((b) => {
    b.onclick = async () => {
      const { error: e } = await sb.from('attendance').update({ check_out: new Date().toISOString() }).eq('id', b.dataset.saida);
      aviso(e ? e.message : 'Saída registrada', !!e);
      recarregar();
    };
  });
  document.querySelectorAll('[data-cancelar]').forEach((b) => {
    b.onclick = async () => {
      const confirmado = await confirmarAcao({ titulo: 'Cancelar plano?', texto: 'O plano deste aluno será marcado como cancelado.', confirmar: 'Cancelar plano', cancelar: 'Voltar' });
      if (!confirmado) return;
      const { error: e } = await sb.from('student_plans')
        .update({ status: 'cancelado', canceled_at: hoje() }).eq('id', b.dataset.cancelar);
      aviso(e ? e.message : 'Plano cancelado', !!e);
      recarregar();
    };
  });
}

async function cadastrarAluno(evento, recarregar) {
  evento.preventDefault();
  const modalidades = [...document.querySelectorAll('[name=modalidade]:checked')].map((c) => c.value);
  if (!modalidades.length) return aviso('Marque ao menos uma modalidade', true);

  const novo = await sb.from('students').insert({
    name: document.getElementById('n-nome').value,
    phone: document.getElementById('n-telefone').value || null,
    email: document.getElementById('n-email').value || null,
  }).select('id').single();
  if (novo.error) return aviso(novo.error.code === '23505' ? 'Já existe aluno com este e-mail' : novo.error.message, true);

  const inicio = document.getElementById('n-inicio').value;
  const tipo = document.getElementById('n-tipo').value;
  const plano = await sb.from('student_plans').insert({
    student_id: novo.data.id, kind: tipo, modality_ids: modalidades,
    start_date: inicio, end_date: fimDoPlano(inicio, tipo),
  });
  aviso(plano.error ? plano.error.message : 'Aluno cadastrado', !!plano.error);
  recarregar();
}
