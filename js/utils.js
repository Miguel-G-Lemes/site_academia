/* Funções e constantes compartilhadas entre site, painel e área do aluno */

const MODALIDADES = {
  musculacao: 'Musculação',
  aerobico: 'Aeróbico',
  natacao: 'Natação',
  pilates: 'Pilates',
  danca: 'Dança',
  hidro: 'Hidroginástica',
};

// Datas no formato AAAA-MM-DD, no fuso do navegador
const hoje = () => new Date().toLocaleDateString('sv-SE');

function somarDias(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toLocaleDateString('sv-SE');
}

// Escapa texto vindo do banco antes de colocar no HTML
function esc(texto) {
  const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(texto ?? '').replace(/[&<>"]/g, (c) => mapa[c]);
}

const formatarData = (iso) => (iso ? iso.split('-').reverse().join('/') : '-');
const formatarHora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const rotulo = (texto) => texto.replace('nao', 'não').replace(/_/g, ' ');

// Plano mais recente do aluno (maior data de vencimento)
function planoAtual(planos) {
  return (planos || []).slice().sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
}

// Situação do plano para exibição: { texto, classe }
function situacaoPlano(plano) {
  if (!plano) return { texto: 'sem plano', classe: '' };
  if (plano.status === 'cancelado') return { texto: 'cancelado', classe: 'venc' };
  if (plano.status === 'pendente') return { texto: 'pendente', classe: 'prox' };
  if (plano.end_date < hoje()) return { texto: 'vencido', classe: 'venc' };
  if (plano.end_date <= somarDias(7)) return { texto: 'vence em breve', classe: 'prox' };
  return { texto: 'ativo', classe: 'ativo' };
}

// Estado vazio: astronauta com uma frase curta (site e painel)
const vazioHtml = (frase) => `
  <div class="vazio">
    <img src="assets/astronauta.svg" alt="" width="140" height="140" loading="lazy">
    <p>${frase}</p>
  </div>`;

// Chamada pelo onerror das fotos: sem arquivo, mostra um bloco vermelho e preto com o nome
function semImagem(img) {
  img.parentElement.classList.add('foto--vazia');
  img.remove();
}
