-- Recuperação de acesso. Rode só o bloco de que precisar (um por vez) no SQL Editor.

-- 1) Liberar como EQUIPE um usuário que já existe em Authentication > Users (troque o e-mail):
insert into public.staff (user_id, name)
select id, 'Equipe' from auth.users where email = 'miguelgoncalves.lemes@gmail.com'
on conflict (user_id) do nothing;

-- 2) Ver quem está liberado como equipe agora:
-- select u.email, s.name from public.staff s join auth.users u on u.id = s.user_id;

-- 3) Ver todas as contas que existem e se já foram confirmadas:
-- select email, email_confirmed_at, last_sign_in_at from auth.users order by created_at;

-- 4) Liberar contas presas na confirmação de e-mail (alunos que se cadastraram antes e não conseguem entrar):
-- update auth.users set email_confirmed_at = now() where email_confirmed_at is null;

-- 5) Conferir os alunos cadastrados e quais já têm conta vinculada:
-- select name, email, user_id is not null as tem_conta from public.students order by name;
