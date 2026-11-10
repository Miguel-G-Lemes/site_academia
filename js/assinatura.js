/* Página de assinatura: plano e modalidades, pagamento SIMULADO e registro automático do aluno */
const campo = (id) => document.getElementById(id);
const estado = { plano: 'mensal' };

// ---------- Tela ----------
function mostrarRetorno(texto, tipo) {
  const el = campo('retorno');
  el.textContent = texto || '';
  el.className = tipo ? `retorno retorno--${tipo}` : 'retorno';
}

function desenharModalidades() {
  campo('modalidades').innerHTML = Object.entries(MODALIDADES).map(([id, nome]) => `
    <label class="opcao"><input type="checkbox" name="modalidade" value="${id}"><span class="opcao__corpo">${nome}</span></label>`).join('');
}

const modalidadesEscolhidas = () => [...document.querySelectorAll('[name=modalidade]:checked')].map((c) => c.value);

function atualizarResumo() {
  const plano = PLANOS[estado.plano];
  const escolhidas = modalidadesEscolhidas();
  campo('resumo-plano').textContent = plano.nome;
  campo('resumo-valor').textContent = `${formatarPreco(plano.preco)} ${plano.periodo}`;
  campo('resumo-modalidades').textContent = escolhidas.length ? escolhidas.map((id) => MODALIDADES[id]).join(', ') : 'Nenhuma escolhida ainda';
  campo('pagar').textContent = `Pagar ${formatarPreco(plano.preco)}`;
}

// ---------- Máscaras do cartão (só visuais: nada do cartão é enviado ou guardado) ----------
const apenasDigitos = (texto) => texto.replace(/\D/g, '');

function mascarar() {
  campo('cartao-numero').addEventListener('input', (e) => {
    e.target.value = apenasDigitos(e.target.value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  campo('cartao-validade').addEventListener('input', (e) => {
    const d = apenasDigitos(e.target.value).slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
  campo('cartao-cvv').addEventListener('input', (e) => { e.target.value = apenasDigitos(e.target.value).slice(0, 4); });
}

// ---------- Validação ----------
function validar() {
  if (!modalidadesEscolhidas().length) return 'Escolha ao menos uma modalidade.';
  if (campo('nome').value.trim().length < 3) return 'Informe seu nome completo.';
  if (!campo('email').validity.valid || !campo('email').value) return 'Informe um e-mail válido.';
  if (apenasDigitos(campo('telefone').value).length < 8) return 'Informe um telefone válido.';
  if (campo('cartao-nome').value.trim().length < 3) return 'Informe o nome impresso no cartão.';
  if (apenasDigitos(campo('cartao-numero').value).length < 13) return 'Confira o número do cartão.';
  const validade = campo('cartao-validade').value.match(/^(\d{2})\/(\d{2})$/);
  if (!validade || Number(validade[1]) < 1 || Number(validade[1]) > 12) return 'Confira a validade do cartão (MM/AA).';
  if (campo('cartao-cvv').value.length < 3) return 'Confira o código de segurança do cartão.';
  return '';
}

// ---------- Pagamento simulado e registro do aluno ----------
async function assinar(evento) {
  evento.preventDefault();
  const erro = validar();
  if (erro) return mostrarRetorno(erro, 'erro');

  campo('pagar').disabled = true;
  mostrarRetorno('Processando pagamento…', 'info');
  await new Promise((resolver) => setTimeout(resolver, 1800));   // simulação: nada é cobrado

  const { data, error } = await sb.rpc('subscribe_plan', {
    p_name: campo('nome').value,
    p_email: campo('email').value,
    p_phone: campo('telefone').value,
    p_kind: estado.plano,
    p_modalities: modalidadesEscolhidas(),
  });
  if (error) {
    campo('pagar').disabled = false;
    return mostrarRetorno(error.message, 'erro');
  }

  // Se a pessoa estiver logada com o mesmo e-mail, liga a conta à matrícula recém-criada
  const { data: { session } } = await sb.auth.getSession();
  if (session) await sb.rpc('link_student');

  mostrarSucesso(data);
}

function mostrarSucesso(assinatura) {
  const plano = PLANOS[assinatura.kind];
  campo('formulario-assinatura').closest('.assinatura').hidden = true;
  campo('sucesso').hidden = false;
  campo('sucesso-detalhes').innerHTML = `
    <li>Plano <strong>${plano.nome}</strong>, ${formatarPreco(plano.preco)} ${plano.periodo}</li>
    <li>Modalidades: <strong>${esc(campo('resumo-modalidades').textContent)}</strong></li>
    <li>Válido até <strong>${formatarData(assinatura.end)}</strong></li>`;
  campo('sucesso-email').textContent = campo('email').value;
  campo('formulario-assinatura').reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Início ----------
async function preencherDadosDaConta() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  campo('email').value = session.user.email;
  campo('nome').value = (session.user.user_metadata && session.user.user_metadata.name) || '';
}

function iniciar() {
  const pedido = new URLSearchParams(location.search).get('plano');
  if (PLANOS[pedido]) estado.plano = pedido;
  campo(`plano-${estado.plano}`).checked = true;

  desenharModalidades();
  mascarar();
  atualizarResumo();
  preencherDadosDaConta();

  document.querySelectorAll('[name=plano]').forEach((r) => r.addEventListener('change', () => { estado.plano = r.value; atualizarResumo(); }));
  campo('modalidades').addEventListener('change', atualizarResumo);
  campo('formulario-assinatura').addEventListener('submit', assinar);
}

iniciar();
