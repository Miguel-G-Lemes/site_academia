/* Área do aluno: qualquer pessoa cria conta (matrícula não é exigida); quem já é aluno vê o próprio plano */
const $ = (seletor) => document.querySelector(seletor);
let primeiroAcesso = false;

function mostrarRetorno(texto, erro = false) {
  $('#retorno').textContent = texto || '';
  $('#retorno').className = !texto ? 'retorno' : erro ? 'retorno retorno--erro' : 'retorno retorno--info';
}

function trocarAba(criarAcesso) {
  primeiroAcesso = criarAcesso;
  $('#aba-entrar').classList.toggle('ativa', !criarAcesso);
  $('#aba-primeiro').classList.toggle('ativa', criarAcesso);
  $('#enviar').textContent = criarAcesso ? 'Criar conta' : 'Entrar';
  $('#rotulo-nome').hidden = !criarAcesso;
  $('#nome').required = criarAcesso;
  $('#dica-primeiro').hidden = !criarAcesso;
  $('#senha').autocomplete = criarAcesso ? 'new-password' : 'current-password';
  mostrarRetorno();
}

async function entrar(credenciais) {
  const { error } = await sb.auth.signInWithPassword(credenciais);
  if (!error) return carregarDados();

  const pendente = /confirm/i.test(error.message);
  mostrarRetorno(
    pendente
      ? 'A confirmação de e-mail ainda está ativa no Supabase. Peça à equipe para desativá-la.'
      : 'E-mail ou senha incorretos.',
    true
  );
}

async function enviarFormulario(evento) {
  evento.preventDefault();
  mostrarRetorno();
  $('#enviar').disabled = true;

  const credenciais = { email: $('#email').value, password: $('#senha').value };
  if (primeiroAcesso) {
    // O nome vai junto: o banco cria o registro em "profiles" assim que a conta nasce
    const { error } = await sb.auth.signUp({ ...credenciais, options: { data: { name: $('#nome').value.trim() } } });
    if (error && !/already/i.test(error.message)) {
      $('#enviar').disabled = false;
      return mostrarRetorno(error.message, true);
    }
  }
  await entrar(credenciais);
  $('#enviar').disabled = false;
}

// Mostra o plano, se a pessoa já for aluna; senão, a conta simples
async function carregarDados() {
  const { data: { user } } = await sb.auth.getUser();
  await sb.rpc('link_student'); // liga a conta ao cadastro feito pela recepção, se houver, pelo e-mail

  const { data: aluno, error } = await sb.from('students')
    .select('name, student_plans(kind,start_date,end_date,status), attendance(check_in,check_out), absences(absence_date,reason)')
    .eq('user_id', user.id)
    .maybeSingle();

  $('#acesso').hidden = true;
  $('#meus-dados').hidden = false;
  if (error || !aluno) return mostrarConta(user);
  mostrarAluno(aluno);
}

function ligarBotaoSair() {
  $('#sair').onclick = async () => {
    if (!(await confirmarSaida())) return;
    await sb.auth.signOut();
    location.reload();
  };
}

async function mostrarConta(user) {
  const { data: perfil } = await sb.from('profiles').select('name,email').eq('id', user.id).maybeSingle();
  const nome = (perfil && perfil.name) || user.user_metadata?.name || user.email;

  $('#meus-dados').innerHTML = `
    <div class="caixa">
      <h1>Olá, ${esc(nome.split(' ')[0])}</h1>
      <p>Sua conta foi criada com o e-mail <strong>${esc(user.email)}</strong>.</p>
      <p class="dica">Você ainda não tem matrícula. Quando virar aluno, seu plano, suas presenças e suas faltas aparecem aqui. Que tal começar com uma aula experimental?</p>
      <a class="btn" href="index.html#agendar">Agendar aula experimental</a>
    </div>
    <button class="btn btn--ghost" id="sair">Sair</button>`;
  ligarBotaoSair();
}

function mostrarAluno(aluno) {
  const plano = planoAtual(aluno.student_plans);
  const situacao = situacaoPlano(plano);
  const presencas = (aluno.attendance || []).sort((a, b) => b.check_in.localeCompare(a.check_in)).slice(0, 10);
  const faltas = (aluno.absences || []).sort((a, b) => b.absence_date.localeCompare(a.absence_date));
  const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  $('#meus-dados').innerHTML = `
    <div class="caixa">
      <h1>Olá, ${esc(aluno.name.split(' ')[0])}</h1>
      <p><span class="selo ${situacao.classe}">${situacao.texto}</span></p>
      ${plano
        ? `<p class="plano-destaque">Plano ${plano.kind}</p><p>Início: ${formatarData(plano.start_date)} · Vencimento: ${formatarData(plano.end_date)}</p>`
        : '<p>Você ainda não tem plano registrado.</p>'}
    </div>
    ${['ativo', 'prox'].includes(situacao.classe) ? '<div class="caixa"><h2>Área do assinante</h2><p>Registre presença, veja seu tempo de treino, use o timer e consulte os exercícios.</p><a class="btn" href="assinante.html">Abrir a área do assinante</a></div>' : ''}
    <div class="caixa"><h2>Últimas presenças</h2>
      ${presencas.length
        ? `<ul>${presencas.map((p) => `<li>Entrada ${dataHora(p.check_in)}${p.check_out ? ' · saída ' + dataHora(p.check_out) : ''}</li>`).join('')}</ul>`
        : '<p class="dica">Nenhuma presença registrada.</p>'}
    </div>
    <div class="caixa"><h2>Faltas justificadas</h2>
      ${faltas.length
        ? `<ul>${faltas.map((f) => `<li>${formatarData(f.absence_date)}: ${esc(f.reason)}</li>`).join('')}</ul>`
        : '<p class="dica">Nenhuma falta registrada.</p>'}
    </div>
    <button class="btn btn--ghost" id="sair">Sair</button>`;
  ligarBotaoSair();
}

$('#aba-entrar').onclick = () => trocarAba(false);
$('#aba-primeiro').onclick = () => trocarAba(true);
$('#formulario').addEventListener('submit', enviarFormulario);
sb.auth.getSession().then(({ data }) => data.session && carregarDados());
