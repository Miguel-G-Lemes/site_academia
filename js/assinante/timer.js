/* Timer de treino: descanso (contagem regressiva com atalhos) e cronômetro com voltas.
   Usa a hora do relógio, então continua certo mesmo com a tela bloqueada por instantes. */
const PRESETS_DESCANSO = [30, 45, 60, 90, 120, 180];
const doisDigitos = (n) => String(n).padStart(2, '0');

function formatarRelogio(ms, comDecimos = false) {
  const total = Math.max(0, ms);
  const horas = Math.floor(total / 3600000);
  const minutos = Math.floor((total % 3600000) / 60000);
  const segundos = Math.floor((total % 60000) / 1000);
  const base = horas ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(segundos)}` : `${doisDigitos(minutos)}:${doisDigitos(segundos)}`;
  return comDecimos ? `${base}.${Math.floor((total % 1000) / 100)}` : base;
}

const rotuloPreset = (s) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`);

// ---------- Apoios: som, vibração e tela ligada ----------
let contextoAudio = null;
function prepararAudio() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!contextoAudio && Contexto) contextoAudio = new Contexto();
  if (contextoAudio && contextoAudio.state === 'suspended') contextoAudio.resume();
}

function apitar() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  if (!contextoAudio) return;
  [0, 0.28, 0.56].forEach((atraso) => {
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();
    oscilador.frequency.value = 880;
    ganho.gain.value = 0.2;
    oscilador.connect(ganho);
    ganho.connect(contextoAudio.destination);
    const inicio = contextoAudio.currentTime + atraso;
    oscilador.start(inicio);
    oscilador.stop(inicio + 0.16);
  });
}

let travaDeTela = null;
async function manterTelaLigada() {
  const precisa = descanso.ativo || cronometro.ativo;
  try {
    if (precisa && !travaDeTela && 'wakeLock' in navigator) travaDeTela = await navigator.wakeLock.request('screen');
    if (!precisa && travaDeTela) { await travaDeTela.release(); travaDeTela = null; }
  } catch (erro) { travaDeTela = null; }
}

// ---------- Descanso (contagem regressiva) ----------
const descanso = { total: 60000, restante: 60000, fim: 0, ativo: false, relogio: null };

function desenharDescanso() {
  const restante = descanso.ativo ? Math.max(0, descanso.fim - Date.now()) : descanso.restante;
  campo('descanso-visor').textContent = formatarRelogio(Math.ceil(restante / 1000) * 1000);
  campo('descanso-barra').style.transform = `scaleX(${descanso.total ? restante / descanso.total : 0})`;
  campo('descanso-iniciar').textContent = descanso.ativo ? 'Pausar' : descanso.restante > 0 && descanso.restante < descanso.total ? 'Continuar' : 'Iniciar';
  document.querySelectorAll('.timer__atalho').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.segundos) * 1000 === descanso.total)));
  if (descanso.ativo && restante === 0) finalizarDescanso();
}

function definirDescanso(segundos) {
  pararDescanso();
  descanso.total = segundos * 1000;
  descanso.restante = descanso.total;
  campo('descanso-visor').classList.remove('timer__visor--fim');
  campo('descanso-fim').textContent = '';
  desenharDescanso();
}

function pararDescanso() {
  if (descanso.ativo) descanso.restante = Math.max(0, descanso.fim - Date.now());
  descanso.ativo = false;
  clearInterval(descanso.relogio);
  manterTelaLigada();
}

function alternarDescanso() {
  if (descanso.ativo) { pararDescanso(); return desenharDescanso(); }
  prepararAudio();
  if (descanso.restante <= 0) descanso.restante = descanso.total;
  descanso.fim = Date.now() + descanso.restante;
  descanso.ativo = true;
  descanso.relogio = setInterval(desenharDescanso, 100);
  campo('descanso-visor').classList.remove('timer__visor--fim');
  campo('descanso-fim').textContent = '';
  manterTelaLigada();
  desenharDescanso();
}

function finalizarDescanso() {
  descanso.ativo = false;
  descanso.restante = 0;
  clearInterval(descanso.relogio);
  manterTelaLigada();
  apitar();
  campo('descanso-visor').classList.add('timer__visor--fim');
  campo('descanso-fim').textContent = 'Descanso finalizado. Hora da próxima série!';
  campo('descanso-iniciar').textContent = 'Iniciar';
}

function iniciarDescanso() {
  campo('descanso-atalhos').innerHTML = PRESETS_DESCANSO.map((s) => `<button type="button" class="timer__atalho" data-segundos="${s}" aria-pressed="false">${rotuloPreset(s)}</button>`).join('');
  campo('descanso-atalhos').addEventListener('click', (e) => { if (e.target.dataset.segundos) definirDescanso(Number(e.target.dataset.segundos)); });
  campo('descanso-iniciar').addEventListener('click', alternarDescanso);
  campo('descanso-zerar').addEventListener('click', () => definirDescanso(descanso.total / 1000));
  campo('descanso-definir').addEventListener('click', () => {
    const segundos = Number(campo('descanso-min').value || 0) * 60 + Number(campo('descanso-seg').value || 0);
    if (segundos < 1 || segundos > 3599) return (campo('descanso-fim').textContent = 'Informe um tempo entre 1 segundo e 59 min 59 s.');
    definirDescanso(segundos);
  });
  desenharDescanso();
}

// ---------- Cronômetro ----------
const cronometro = { acumulado: 0, inicio: 0, ativo: false, relogio: null, voltas: [], ultimaVolta: 0 };
const tempoDoCronometro = () => cronometro.acumulado + (cronometro.ativo ? Date.now() - cronometro.inicio : 0);

function desenharCronometro() {
  campo('cronometro-visor').textContent = formatarRelogio(tempoDoCronometro(), true);
  campo('cronometro-iniciar').textContent = cronometro.ativo ? 'Pausar' : tempoDoCronometro() > 0 ? 'Continuar' : 'Iniciar';
  campo('cronometro-volta').disabled = !cronometro.ativo;
  campo('cronometro-voltas').innerHTML = cronometro.voltas.map((ms) => `<li>${formatarRelogio(ms, true)}</li>`).join('');
}

function alternarCronometro() {
  if (cronometro.ativo) {
    cronometro.acumulado = tempoDoCronometro();
    cronometro.ativo = false;
    clearInterval(cronometro.relogio);
  } else {
    cronometro.inicio = Date.now();
    cronometro.ativo = true;
    cronometro.relogio = setInterval(desenharCronometro, 100);
  }
  manterTelaLigada();
  desenharCronometro();
}

function marcarVolta() {
  const agora = tempoDoCronometro();
  if (cronometro.voltas.length < 30) cronometro.voltas.push(agora - cronometro.ultimaVolta);
  cronometro.ultimaVolta = agora;
  desenharCronometro();
}

function zerarCronometro() {
  cronometro.ativo = false;
  clearInterval(cronometro.relogio);
  Object.assign(cronometro, { acumulado: 0, inicio: 0, voltas: [], ultimaVolta: 0 });
  manterTelaLigada();
  desenharCronometro();
}

function iniciarCronometro() {
  campo('cronometro-iniciar').addEventListener('click', alternarCronometro);
  campo('cronometro-volta').addEventListener('click', marcarVolta);
  campo('cronometro-zerar').addEventListener('click', zerarCronometro);
  desenharCronometro();
}

// ---------- Abas ----------
function iniciarAbasDoTimer() {
  const abas = { descanso: ['aba-descanso', 'painel-descanso'], cronometro: ['aba-cronometro', 'painel-cronometro'] };
  Object.entries(abas).forEach(([nome, [idAba]]) => {
    campo(idAba).addEventListener('click', () => {
      Object.entries(abas).forEach(([outro, [aba, painel]]) => {
        campo(aba).setAttribute('aria-selected', String(outro === nome));
        campo(painel).hidden = outro !== nome;
      });
    });
  });
}

function iniciarTimer() {
  iniciarAbasDoTimer();
  iniciarDescanso();
  iniciarCronometro();
}
