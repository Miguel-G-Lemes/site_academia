/* Painel: gráficos das estatísticas (Chart.js). Três tipos: barras, rosca e linha. */
const COR = { vermelho: '#d4202a', rosa: '#f06b72', claro: '#f1f1f2', cinza: '#6b6b72', escuro: '#2a2a2d' };
const PALETA = ['#d4202a', '#f06b72', '#f1f1f2', '#8b1218', '#9b9ba1', '#4a4a50'];
let graficosAtivos = [];

function limparGraficos() {
  graficosAtivos.forEach((grafico) => grafico.destroy());
  graficosAtivos = [];
}

function criarGrafico(idCanvas, configuracao) {
  graficosAtivos.push(new Chart(document.getElementById(idCanvas), configuracao));
}

const escalaContagem = { y: { beginAtZero: true, ticks: { precision: 0 } } };

function desenharGraficos(dados, filtro) {
  if (typeof Chart === 'undefined') {
    document.getElementById('graficos').innerHTML = '<p class="erro">Não foi possível carregar os gráficos. Verifique a conexão com a internet.</p>';
    return;
  }
  Chart.defaults.color = '#9b9ba1';
  Chart.defaults.borderColor = '#2a2a2d';
  Chart.defaults.font.family = "'Public Sans', sans-serif";

  const nome = filtro ? MODALIDADES[filtro] : '';
  const base = { responsive: true, maintainAspectRatio: false };

  // 1) Barras: presença. Com filtro, só a modalidade escolhida (hoje, semana e mês).
  if (filtro) {
    const n = calcular(dados, filtro);
    criarGrafico('g-presenca', {
      type: 'bar',
      data: { labels: ['Hoje', 'Na semana', 'No mês'], datasets: [{ label: nome, data: [n.hoje, n.semana, n.mes], backgroundColor: [COR.vermelho, COR.rosa, COR.claro] }] },
      options: { ...base, scales: escalaContagem, plugins: { legend: { display: false } } },
    });
  } else {
    const ids = Object.keys(MODALIDADES);
    const numeros = ids.map((id) => calcular(dados, id));
    criarGrafico('g-presenca', {
      type: 'bar',
      data: {
        labels: ids.map((id) => MODALIDADES[id]),
        datasets: [
          { label: 'Hoje', data: numeros.map((n) => n.hoje), backgroundColor: COR.vermelho },
          { label: 'Na semana', data: numeros.map((n) => n.semana), backgroundColor: COR.rosa },
          { label: 'No mês', data: numeros.map((n) => n.mes), backgroundColor: COR.cinza },
        ],
      },
      options: { ...base, scales: escalaContagem, plugins: { legend: { position: 'bottom' } } },
    });
  }

  // 2) Rosca: alunos ativos por modalidade (com filtro: planos mensais x anuais da modalidade)
  const parte = distribuicao(dados, filtro);
  criarGrafico('g-distribuicao', {
    type: 'doughnut',
    data: { labels: parte.rotulos, datasets: [{ data: parte.valores, backgroundColor: PALETA, borderColor: '#161617' }] },
    options: { ...base, plugins: { legend: { position: 'bottom' } } },
  });

  // 3) Linha: assinaturas x cancelamentos nos últimos 6 meses
  const serie = serieMensal(dados, filtro);
  criarGrafico('g-evolucao', {
    type: 'line',
    data: {
      labels: serie.rotulos,
      datasets: [
        { label: 'Assinaturas', data: serie.assinaturas, borderColor: COR.vermelho, backgroundColor: COR.vermelho, tension: 0.3 },
        { label: 'Cancelamentos', data: serie.cancelamentos, borderColor: COR.claro, backgroundColor: COR.claro, tension: 0.3 },
      ],
    },
    options: { ...base, scales: escalaContagem, plugins: { legend: { position: 'bottom' } } },
  });
}
