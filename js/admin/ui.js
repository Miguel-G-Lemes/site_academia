/* Painel: utilidades de interface (conteúdo, avisos, erros) */
const conteudo = () => document.getElementById('conteudo');

function aviso(texto, erro = false) {
  const el = document.getElementById('aviso');
  el.textContent = texto;
  el.className = erro ? 'aviso-flutuante aviso-flutuante--erro' : 'aviso-flutuante';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

function mostrarErro(erro) {
  conteudo().innerHTML = `<p class="erro">Erro ao carregar: ${esc(erro.message)}</p>`;
}

// Contagem exata de uma consulta com { count: 'exact', head: true }
async function contar(consulta) {
  const { count, error } = await consulta;
  if (error) throw error;
  return count ?? 0;
}

const cartao = (valor, titulo, tom = '') =>
  `<div class="card ${tom ? `card--${tom}` : ''}"><strong>${valor}</strong><span>${titulo}</span></div>`;

function opcoes(lista, selecionado) {
  return lista.map((v) => `<option value="${v}" ${v === selecionado ? 'selected' : ''}>${rotulo(v)}</option>`).join('');
}

// Estado vazio: astronauta com uma frase curta. Dentro de tabelas, ocupa a linha inteira.
const vazioHtml = (frase) => `
  <div class="vazio">
    <img src="assets/astronauta.svg" alt="" width="140" height="140" loading="lazy">
    <p>${frase}</p>
  </div>`;
const linhaVazia = (colunas, frase) => `<tr><td class="vazio-celula" colspan="${colunas}">${vazioHtml(frase)}</td></tr>`;
