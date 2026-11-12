/* Área do assinante: confere quem está logado e se o plano está ativo */
async function verificarAcesso() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { estado: 'visitante' };

  await sb.rpc('link_student');   // liga a conta ao cadastro de aluno pelo e-mail, se ainda não estiver ligada
  const { data: aluno } = await sb.from('students').select('id,name').eq('user_id', session.user.id).maybeSingle();
  if (!aluno) return { estado: 'sem-aluno', user: session.user };

  const { data: planos } = await sb.from('student_plans').select('id,kind,end_date')
    .eq('student_id', aluno.id).eq('status', 'ativo').gte('end_date', hoje()).limit(1);
  if (!planos || !planos.length) return { estado: 'sem-plano', aluno, user: session.user };
  return { estado: 'ok', aluno, plano: planos[0], user: session.user };
}

const MENSAGENS_BLOQUEIO = {
  visitante: { titulo: 'Área exclusiva para assinantes', texto: 'Entre na sua conta para registrar presença, usar o timer e ver os exercícios.', acoes: [['Entrar na minha conta', 'aluno.html', ''], ['Ver planos', 'index.html#planos', 'btn--ghost']] },
  'sem-aluno': { titulo: 'Você ainda não é assinante', texto: 'Sua conta existe, mas não encontramos um plano para este e-mail. Assine para liberar a área.', acoes: [['Assinar um plano', 'assinar.html', '']] },
  'sem-plano': { titulo: 'Seu plano não está ativo', texto: 'Renove a sua assinatura para voltar a usar a área do assinante.', acoes: [['Renovar assinatura', 'assinar.html', '']] },
};

function mostrarBloqueio(estado) {
  const m = MENSAGENS_BLOQUEIO[estado];
  campo('assinante-bloqueio').innerHTML = `
    <div class="bloqueio">
      <img src="assets/astronauta.svg" alt="" width="140" height="140">
      <h2>${m.titulo}</h2>
      <p>${m.texto}</p>
      <div class="bloqueio__acoes">${m.acoes.map(([texto, link, classe]) => `<a class="btn btn--grande ${classe}" href="${link}">${texto}</a>`).join('')}</div>
    </div>`;
  campo('assinante-bloqueio').hidden = false;
}
