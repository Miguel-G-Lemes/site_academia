# Academia Marte (site, painel da equipe e área do aluno)

## Estrutura
```
index.html  nos-conheca.html  assinar.html  assinante.html  404.html  aluno.html  admin.html  config.js
css/
  tokens.css            variáveis: cores, fontes, espaçamentos, raios, sombras, movimento
  base.css              reset e tipografia (importa tokens, botões e modal)
  site.css              índice: importa um arquivo por seção do site público
  componentes/          botoes, modal, selos, foto, formularios, conta, voltar, vazio
  site/                 splash, cabecalho, secoes, hero, modalidades, numeros, diferenciais,
                        depoimentos, planos, experimental, faq, contato, rodape, flutuantes,
                        interna (nos-conheca e 404), assinatura, assinante, tempo, timer, exercicios
  hover.css             texto vermelho ao passar o cursor (carregue por último)
  painel.css            índice do painel da equipe (um arquivo por assunto em css/painel/)
  aluno.css             área do aluno
js/
  dados-site.js         números, depoimentos, perguntas e contatos de exemplo (edite aqui)
  planos.js             planos, valores e benefícios de exemplo
  modal.js  confirmar.js  utils.js  supabase-client.js
  layout.js + layout/   cabeçalho, rodapé, itens flutuantes e ícones (icones.js também serve ao painel)
  conta.js              cabeçalho conforme quem está logado
  modalidades.js  agendamento.js  assinatura.js  aluno.js  splash.js  revelar.js
  home/                 numeros, depoimentos, faq, contato, cartoes-planos
  assinante.js + assinante/   área do assinante: acesso, presenca, tempo, timer, exercicios
  admin/                painel da equipe (inclui exercicios.js)
supabase/  schema.sql  horarios_exemplo.sql  recuperar_acesso.sql
assets/    logo.svg  astronauta.svg  hero.jpg  carafeliz.jpg  fotos das modalidades
```

## Configuração
1. No SQL Editor do Supabase, rode o `schema.sql` inteiro (seguro para rodar de novo).
2. Rode o `horarios_exemplo.sql` para cadastrar horários de aula experimental.
3. Authentication > Users: crie o usuário da equipe e libere-o em `staff` (veja `recuperar_acesso.sql`).
4. Edite `config.js` com a URL e a chave publicável (anon). Nunca use a service_role.
5. Desligue "Confirm email" no provedor de e-mail para o aluno criar conta sem confirmação.
6. Exercícios com arquivo: o `schema.sql` cria o bucket privado `exercicios` (limite de 50 MB por arquivo). A equipe envia pelo painel, na tela Exercícios.
7. Avisos em tempo real de novas reservas: o `schema.sql` ativa o Realtime da tabela de reservas.
8. Rode `npx serve .` ou `python3 -m http.server 8000` e abra `index.html`.

## Onde mudar o quê
- Cores, fontes, espaçamentos e raios: `css/tokens.css`.
- Cabeçalho fixo ou não: `--topo-posicao` em `css/tokens.css` (`sticky` ou `relative`).
- Textos de exemplo (números, depoimentos, perguntas, contatos): `js/dados-site.js`.
- Valores e benefícios dos planos: `js/planos.js`.
