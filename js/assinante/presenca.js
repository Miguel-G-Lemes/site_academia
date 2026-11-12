/* Presença: o assinante marca quando chegou e quando saiu da academia.
   A hora é gravada pelo servidor (funções student_checkin e student_checkout). */
const horaCurta = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const diaDaVisita = (iso) => formatarData(new Date(iso).toLocaleDateString('sv-SE'));

function visitaEmAndamento(visitas, agora = new Date()) {
  return visitas.find((v) => !v.check_out && agora - new Date(v.check_in) <= LIMITE_VISITA_ABERTA_MS);
}

function renderPresenca(visitas, agora = new Date()) {
  const aberta = visitaEmAndamento(visitas, agora);
  const ultima = visitas.find((v) => v.check_out);

  campo('presenca-titulo').textContent = aberta ? 'Você está na academia' : 'Você não está na academia';
  campo('presenca-detalhe').textContent = aberta
    ? `Chegada às ${horaCurta(aberta.check_in)}, ${formatarDuracao(agora - new Date(aberta.check_in))} de treino até agora.`
    : ultima
      ? `Última visita: ${diaDaVisita(ultima.check_in)}, das ${horaCurta(ultima.check_in)} às ${horaCurta(ultima.check_out)}.`
      : 'Marque "Cheguei" assim que entrar na academia.';
  campo('btn-chegada').disabled = !!aberta;
  campo('btn-saida').disabled = !aberta;
}

async function registrarPresenca(funcao, aoConcluir) {
  const retorno = campo('presenca-retorno');
  retorno.className = 'retorno';
  campo('btn-chegada').disabled = true;
  campo('btn-saida').disabled = true;

  const { error } = await sb.rpc(funcao);
  if (error) {
    retorno.textContent = error.message;
    retorno.className = 'retorno retorno--erro presenca__retorno';
  } else {
    retorno.textContent = funcao === 'student_checkin' ? 'Chegada registrada. Bom treino!' : 'Saída registrada. Até a próxima!';
    retorno.className = 'retorno retorno--ok presenca__retorno';
  }
  await aoConcluir();
}

function iniciarPresenca(aoConcluir) {
  campo('btn-chegada').addEventListener('click', () => registrarPresenca('student_checkin', aoConcluir));
  campo('btn-saida').addEventListener('click', () => registrarPresenca('student_checkout', aoConcluir));
}
