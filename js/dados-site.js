/* Conteúdo de exemplo do site: troque aqui os números, depoimentos, perguntas e dados de contato. */

const CONTATO = {
  telefone: '(00) 00000-0000',
  telefoneLink: '+5500000000000',
  email: 'contato@academiamarte.com.br',
  whatsapp: '5500000000000',                       // só números, com código do país
  mensagemWhatsapp: 'Olá! Gostaria de saber mais sobre a Academia Marte.',
  endereco: 'Rua Exemplo, 123, Bairro, Cidade/UF',
  horarios: ['Segunda a sexta, das 6h às 22h', 'Sábado, das 8h às 14h'],
  redes: { instagram: 'https://www.instagram.com/', facebook: 'https://www.facebook.com/' },
};

// Números animados da faixa (valor final, texto antes do número e legenda)
const NUMEROS = [
  { valor: 1200, prefixo: '+', rotulo: 'alunos treinando com a gente' },
  { valor: 6, prefixo: '', rotulo: 'modalidades no mesmo lugar' },
  { valor: 15, prefixo: '', rotulo: 'anos de história' },
];

// Depoimentos de exemplo. Para usar foto, informe o caminho em "foto" (ex.: 'assets/camila.jpg').
const DEPOIMENTOS = [
  { nome: 'Camila R.', foto: '', frase: 'Comecei pela aula experimental e, no mesmo mês, já tinha trocado a rotina inteira. A equipe acompanha de verdade.' },
  { nome: 'Roberto A.', foto: '', frase: 'Faço hidroginástica e musculação. As turmas são pequenas e eu nunca fico perdido nos treinos.' },
  { nome: 'Juliana M.', foto: '', frase: 'O pilates mudou minha postura e meu humor. Ambiente limpo, climatizado e professores atentos.' },
];

const PERGUNTAS = [
  { pergunta: 'Preciso ser aluno para fazer a aula experimental?', resposta: 'Não. Basta escolher a modalidade, o dia e o horário e preencher seus dados. Todas as seis modalidades têm aula experimental.' },
  { pergunta: 'Como funciona a duração das aulas de natação e hidroginástica?', resposta: 'Adultos têm aula de 60 minutos. Crianças e idosos têm aulas de até 45 minutos. O site mostra só os horários compatíveis com a faixa etária.' },
  { pergunta: 'Posso treinar mais de uma modalidade?', resposta: 'Sim. Ao assinar, você marca todas as modalidades que quiser praticar.' },
  { pergunta: 'Qual a diferença entre o plano mensal e o anual?', resposta: 'O mensal é pago mês a mês, com liberdade para cancelar. O anual tem o melhor custo por mês para quem quer constância.' },
  { pergunta: 'Como faço para acompanhar meu plano?', resposta: 'Crie sua conta na Área do aluno com o mesmo e-mail da assinatura. Lá você vê plano, vencimento e presenças.' },
  { pergunta: 'Tenho uma dúvida que não está aqui. E agora?', resposta: 'Fale com a gente pelo WhatsApp, telefone ou e-mail. Os contatos estão no fim da página.' },
];
