/* Tempo na academia: soma as visitas de hoje, da semana, do mês e do ano.
   Cada visita vai da hora de chegada até a hora de saída (visita em andamento conta até agora). */
const LIMITE_VISITA_ABERTA_MS = 12 * 60 * 60 * 1000;   // chegada sem saída há mais de 12 h não entra na soma

function inicioDosPeriodos(agora = new Date()) {
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const semana = new Date(hojeInicio);
  semana.setDate(semana.getDate() - ((hojeInicio.getDay() + 6) % 7));        // segunda-feira
  return {
    hoje: hojeInicio,
    semana,
    mes: new Date(agora.getFullYear(), agora.getMonth(), 1),
    ano: new Date(agora.getFullYear(), 0, 1),
  };
}

// Duração de uma visita em milissegundos; null quando a saída nunca foi registrada
function duracaoDaVisita(visita, agora) {
  const chegada = new Date(visita.check_in).getTime();
  if (visita.check_out) return Math.max(0, new Date(visita.check_out).getTime() - chegada);
  const decorrido = agora.getTime() - chegada;
  return decorrido <= LIMITE_VISITA_ABERTA_MS ? Math.max(0, decorrido) : null;
}

function somarPeriodos(visitas, agora = new Date()) {
  const inicios = inicioDosPeriodos(agora);
  const total = {};
  Object.keys(inicios).forEach((periodo) => { total[periodo] = { ms: 0, visitas: 0 }; });

  visitas.forEach((visita) => {
    const duracao = duracaoDaVisita(visita, agora);
    if (duracao === null) return;
    const chegada = new Date(visita.check_in);
    Object.entries(inicios).forEach(([periodo, inicio]) => {
      if (chegada >= inicio) { total[periodo].ms += duracao; total[periodo].visitas += 1; }
    });
  });
  return total;
}

function formatarDuracao(ms) {
  const minutos = Math.round(ms / 60000);
  if (minutos < 1) return '0 min';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas ? `${horas} h ${String(resto).padStart(2, '0')} min` : `${minutos} min`;
}

const PERIODOS_TABELA = [['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['ano', 'Este ano']];

function renderTempo(visitas, agora = new Date()) {
  const total = somarPeriodos(visitas, agora);
  campo('tabela-tempo').innerHTML = PERIODOS_TABELA.map(([chave, nome]) => {
    const { ms, visitas: quantidade } = total[chave];
    return `
      <tr>
        <th scope="row">${nome}</th>
        <td><span class="tempo__valor tempo__valor--destaque">${formatarDuracao(ms)}</span></td>
        <td><span class="tempo__valor">${quantidade}</span></td>
        <td>${quantidade ? formatarDuracao(ms / quantidade) : '—'}</td>
      </tr>`;
  }).join('');

  const semSaida = visitas.some((v) => duracaoDaVisita(v, agora) === null);
  campo('tempo-nota').textContent = semSaida
    ? 'Algumas chegadas ficaram sem saída registrada e não entram na soma. Lembre-se de marcar "Saí" ao terminar o treino.'
    : 'O tempo é calculado pela hora de chegada e pela hora de saída que você registra.';
}
