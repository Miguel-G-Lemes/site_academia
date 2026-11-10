/* Painel: estatísticas de presença e assinaturas, com gráficos e filtro por modalidade */

function calcularPeriodos() {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(inicioHoje);
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioHoje.getDay() + 6) % 7)); // segunda-feira
  const inicioMesTexto = hoje().slice(0, 8) + '01';
  return { inicioHoje, inicioSemana, inicioMesTexto, inicioMes: new Date(`${inicioMesTexto}T00:00`) };
}

// Sem modalidade (''), considera todas
const daModalidade = (plano, modalidade) => !modalidade || plano.modality_ids.includes(modalidade);
const planoVigente = (plano) => plano.status === 'ativo' && plano.end_date >= hoje();

function calcular(dados, modalidade) {
  const { planos, presencas, periodos } = dados;
  const alunosDaModalidade = new Set(planos.filter((p) => daModalidade(p, modalidade)).map((p) => p.student_id));
  const doGrupo = (idAluno) => !modalidade || alunosDaModalidade.has(idAluno);
  const presentesDesde = (data) => new Set(
    presencas.filter((p) => doGrupo(p.student_id) && new Date(p.check_in) >= data).map((p) => p.student_id)
  ).size;

  return {
    ativos: new Set(planos.filter((p) => daModalidade(p, modalidade) && planoVigente(p)).map((p) => p.student_id)).size,
    hoje: presentesDesde(periodos.inicioHoje),
    semana: presentesDesde(periodos.inicioSemana),
    mes: presentesDesde(periodos.inicioMes),
    novas: planos.filter((p) => daModalidade(p, modalidade) && p.start_date >= periodos.inicioMesTexto).length,
    cancelados: planos.filter((p) => daModalidade(p, modalidade) && p.canceled_at && p.canceled_at >= periodos.inicioMesTexto).length,
  };
}

// Assinaturas e cancelamentos por mês, nos últimos 6 meses
function serieMensal(dados, modalidade) {
  const agora = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const dia1 = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({
      chave: dia1.toLocaleDateString('sv-SE').slice(0, 7),
      rotulo: dia1.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    });
  }
  const contarPor = (campo, chave) => dados.planos.filter(
    (p) => daModalidade(p, modalidade) && p[campo] && p[campo].slice(0, 7) === chave
  ).length;

  return {
    rotulos: meses.map((m) => m.rotulo),
    assinaturas: meses.map((m) => contarPor('start_date', m.chave)),
    cancelamentos: meses.map((m) => contarPor('canceled_at', m.chave)),
  };
}

// Rosca: alunos ativos por modalidade; com filtro, mensal x anual da modalidade
function distribuicao(dados, modalidade) {
  const vigentes = dados.planos.filter(planoVigente);
  const alunos = (lista) => new Set(lista.map((p) => p.student_id)).size;

  if (modalidade) {
    const doGrupo = vigentes.filter((p) => daModalidade(p, modalidade));
    return { rotulos: ['Mensal', 'Anual'], valores: ['mensal', 'anual'].map((tipo) => alunos(doGrupo.filter((p) => p.kind === tipo))) };
  }
  const ids = Object.keys(MODALIDADES);
  return { rotulos: ids.map((id) => MODALIDADES[id]), valores: ids.map((id) => alunos(vigentes.filter((p) => daModalidade(p, id)))) };
}

async function renderEstatisticas(filtro = '') {
  limparGraficos();
  const periodos = calcularPeriodos();
  const desde = periodos.inicioSemana < periodos.inicioMes ? periodos.inicioSemana : periodos.inicioMes;

  const [planosR, presencasR] = await Promise.all([
    sb.from('student_plans').select('student_id,kind,modality_ids,start_date,end_date,status,canceled_at'),
    sb.from('attendance').select('student_id,check_in').gte('check_in', desde.toISOString()),
  ]);
  if (planosR.error) throw planosR.error;
  if (presencasR.error) throw presencasR.error;

  const dados = { planos: planosR.data, presencas: presencasR.data, periodos };
  const numeros = calcular(dados, filtro);
  const idsDaTabela = filtro ? [filtro] : Object.keys(MODALIDADES);   // com filtro, só a modalidade escolhida
  const linhas = idsDaTabela.map((id) => {
    const n = calcular(dados, id);
    return `<tr><td>${MODALIDADES[id]}</td><td>${n.ativos}</td><td>${n.hoje}</td><td>${n.semana}</td><td>${n.mes}</td><td>${n.novas}</td><td>${n.cancelados}</td></tr>`;
  }).join('');

  conteudo().innerHTML = `
    <h2>Estatísticas</h2>
    <div class="barra">
      <select id="filtro-modalidade" aria-label="Categoria">
        <option value="">Todas as modalidades</option>
        ${Object.entries(MODALIDADES).map(([id, nome]) => `<option value="${id}" ${filtro === id ? 'selected' : ''}>${nome}</option>`).join('')}
      </select>
      ${filtro ? `<span class="chip">Em destaque: ${MODALIDADES[filtro]}</span>` : ''}
    </div>
    <div class="cards">
      ${cartao(numeros.ativos, 'Alunos ativos')}
      ${cartao(numeros.hoje, 'Presentes hoje', 'ok')}
      ${cartao(numeros.semana, 'Presentes na semana', 'ok')}
      ${cartao(numeros.mes, 'Presentes no mês', 'ok')}
      ${cartao(numeros.novas, 'Assinaturas no mês')}
      ${cartao(numeros.cancelados, 'Cancelamentos no mês', 'erro')}
    </div>
    <div class="graficos" id="graficos">
      <div class="grafico"><h3>${filtro ? `Presença em ${MODALIDADES[filtro]}` : 'Presença por modalidade'}</h3><div class="grafico__area"><canvas id="g-presenca"></canvas></div></div>
      <div class="grafico"><h3>${filtro ? `Planos ativos em ${MODALIDADES[filtro]}` : 'Alunos ativos por modalidade'}</h3><div class="grafico__area"><canvas id="g-distribuicao"></canvas></div></div>
      <div class="grafico"><h3>Assinaturas e cancelamentos${filtro ? ` · ${MODALIDADES[filtro]}` : ''}</h3><div class="grafico__area"><canvas id="g-evolucao"></canvas></div></div>
    </div>
    <h3>${filtro ? MODALIDADES[filtro] : 'Por modalidade'}</h3>
    <div class="tabela"><table>
      <tr><th>Modalidade</th><th>Ativos</th><th>Hoje</th><th>Semana</th><th>Mês</th><th>Assinaturas</th><th>Cancelamentos</th></tr>
      ${linhas}
    </table></div>
    <p class="card__nota">Presença conta alunos diferentes que entraram no período. Um aluno com plano em mais de uma modalidade aparece em cada uma.</p>`;

  document.getElementById('filtro-modalidade').onchange = (e) => renderEstatisticas(e.target.value);
  desenharGraficos(dados, filtro);
}
