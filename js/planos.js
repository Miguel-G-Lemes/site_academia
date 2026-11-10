/* Planos e valores: fonte única para a home e para a página de assinatura. Valores e benefícios de exemplo. */
const PLANOS = {
  mensal: {
    nome: 'Mensal', preco: 129.9, periodo: 'por mês', meses: 1, destaque: false,
    descricao: 'Pagamento mês a mês, com liberdade para cancelar.',
    beneficios: ['Acesso às modalidades que você escolher', 'Aulas em turmas reduzidas', 'Acompanhamento da equipe de professores', 'Cancelamento quando quiser'],
  },
  anual: {
    nome: 'Anual', preco: 1299.0, periodo: 'por ano', meses: 12, destaque: true,
    descricao: 'Melhor custo por mês para quem quer constância.',
    beneficios: ['Tudo do plano mensal', 'Menor custo por mês', 'Prioridade na escolha de horários', 'Constância que vira resultado'],
  },
};

const formatarPreco = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Preenche todo elemento marcado com data-preco="mensal" ou data-preco="anual"
document.querySelectorAll('[data-preco]').forEach((el) => {
  const plano = PLANOS[el.dataset.preco];
  if (plano) el.textContent = formatarPreco(plano.preco);
});
