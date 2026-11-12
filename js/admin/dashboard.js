/* Painel: indicadores gerais com dados reais */
async function renderPainel() {
  const inicioMes = hoje().slice(0, 8) + '01';
  const contagem = { count: 'exact', head: true };

  const [ativos, interessados, experimentaisHoje, novosNoMes, presentesAgora] = await Promise.all([
    contar(sb.from('students').select('*', contagem).eq('active', true)),
    contar(sb.from('trial_bookings').select('*', contagem)),
    contar(sb.from('trial_bookings').select('*', contagem).eq('on_date', hoje()).neq('status', 'cancelada')),
    contar(sb.from('students').select('*', contagem).gte('created_at', inicioMes)),
    contar(sb.from('attendance').select('*', contagem).is('check_out', null).gte('check_in', new Date(Date.now() - 12 * 3600 * 1000).toISOString())),
  ]);

  const planosAtivos = await sb.from('student_plans').select('kind,end_date').eq('status', 'ativo');
  const proximas = await sb.from('trial_bookings').select('*')
    .gte('on_date', hoje()).neq('status', 'cancelada').order('on_date').limit(8);

  const planos = planosAtivos.data || [];
  const vigentes = planos.filter((p) => p.end_date >= hoje());
  const vencemEmBreve = vigentes.filter((p) => p.end_date <= somarDias(7)).length;
  const vencidos = planos.filter((p) => p.end_date < hoje()).length;

  conteudo().innerHTML = `
    <h2>Painel</h2>
    <div class="cards">
      ${cartao(ativos, 'Alunos ativos')}
      ${cartao(vigentes.filter((p) => p.kind === 'mensal').length, 'Planos mensais')}
      ${cartao(vigentes.filter((p) => p.kind === 'anual').length, 'Planos anuais')}
      ${cartao(interessados, 'Interessados')}
      ${cartao(experimentaisHoje, 'Experimentais hoje')}
      ${cartao(novosNoMes, 'Novos no mês')}
      ${cartao(vencemEmBreve, 'Vencem em 7 dias', 'alerta')}
      ${cartao(vencidos, 'Planos vencidos', 'erro')}
      ${cartao(presentesAgora, 'Presentes agora', 'ok')}
    </div>
    <h3>Próximas aulas experimentais</h3>
    <div class="tabela"><table>
      <tr><th>Data</th><th>Nome</th><th>Modalidade</th><th>Duração</th><th>Status</th></tr>
      ${(proximas.data || []).map((b) => `
        <tr>
          <td>${formatarData(b.on_date)}</td><td>${esc(b.name)}</td><td>${esc(MODALIDADES[b.modality_id])}</td>
          <td>${b.duration_min} min</td><td>${rotulo(b.status)}</td>
        </tr>`).join('') || linhaVazia(5, 'Nenhuma aula experimental por aqui. O espaço está em silêncio.')}
    </table></div>`;
}
