-- =====================================================================
-- Raiz Academia: banco completo (Supabase / Postgres)
-- Pode ser executado várias vezes: não dá conflito se as tabelas,
-- modalidades ou funções já existirem e não apaga dados já cadastrados.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------
create schema if not exists private;

create table if not exists public.modalities (
  id        text primary key,
  name      text not null,
  trial     boolean not null default false,   -- tem aula experimental?
  age_rule  boolean not null default false    -- duração depende da faixa etária?
);

create table if not exists public.staff (
  user_id  uuid primary key references auth.users on delete cascade,
  name     text
);

-- Grade semanal: weekday 0 = domingo ... 6 = sábado
create table if not exists public.class_slots (
  id            uuid primary key default gen_random_uuid(),
  modality_id   text not null references public.modalities,
  weekday       smallint not null check (weekday between 0 and 6),
  start_time    time not null,
  duration_min  int not null,
  capacity      int not null default 6 check (capacity > 0),
  active        boolean not null default true
);

create table if not exists public.blocked_dates (
  id           uuid primary key default gen_random_uuid(),
  on_date      date not null,
  modality_id  text references public.modalities,   -- nulo = bloqueia todas
  reason       text
);

create table if not exists public.students (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.student_plans (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students on delete cascade,
  kind          text not null check (kind in ('mensal', 'anual')),
  modality_ids  text[] not null default '{}',
  start_date    date not null,
  end_date      date not null,
  status        text not null default 'ativo' check (status in ('ativo', 'pendente', 'cancelado'))
);

create table if not exists public.trial_bookings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,
  email         text not null,
  modality_id   text not null references public.modalities,
  slot_id       uuid not null references public.class_slots,
  on_date       date not null,
  age_group     text not null check (age_group in ('crianca', 'adulto', 'idoso')),
  duration_min  int not null,
  notes         text,
  status        text not null default 'agendada'
                check (status in ('agendada', 'confirmada', 'realizada', 'cancelada', 'nao_compareceu')),
  lead_status   text not null default 'aula_agendada'
                check (lead_status in ('novo', 'aula_agendada', 'aula_confirmada', 'aula_realizada',
                                       'quer_contratar', 'plano_contratado', 'sem_interesse', 'nao_compareceu')),
  student_id    uuid references public.students,
  created_at    timestamptz not null default now()
);

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students on delete cascade,
  check_in    timestamptz not null default now(),
  check_out   timestamptz
);

create table if not exists public.absences (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students on delete cascade,
  absence_date  date not null,
  reason        text not null,
  notes         text
);

-- Contas criadas pelo site (qualquer pessoa pode criar; matrícula não é exigida)
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  name        text,
  created_at  timestamptz not null default now()
);

-- Colunas adicionadas depois (seguro se já existirem)
alter table public.students      add column if not exists user_id uuid unique references auth.users on delete set null;
alter table public.student_plans add column if not exists canceled_at date;

-- ---------------------------------------------------------------------
-- 2. Modalidades (atualiza as existentes em vez de duplicar)
-- ---------------------------------------------------------------------
insert into public.modalities (id, name, trial, age_rule) values
  ('musculacao', 'Musculação',     true,  false),
  ('aerobico',   'Aeróbico',       true,  false),
  ('natacao',    'Natação',        true,  true),
  ('pilates',    'Pilates',        true,  false),
  ('danca',      'Dança',          true,  false),
  ('hidro',      'Hidroginástica', true,  true)
on conflict (id) do update
  set name = excluded.name, trial = excluded.trial, age_rule = excluded.age_rule;

-- ---------------------------------------------------------------------
-- 3. Regras de duração: livre, exceto natação e hidroginástica (45 ou 60 min)
-- ---------------------------------------------------------------------
alter table public.class_slots drop constraint if exists class_slots_duration_min_check;
alter table public.class_slots drop constraint if exists class_slots_duration_range;
alter table public.class_slots drop constraint if exists class_slots_duration_age_rule;
alter table public.class_slots add constraint class_slots_duration_range
  check (duration_min between 5 and 480);
alter table public.class_slots add constraint class_slots_duration_age_rule
  check (modality_id not in ('natacao', 'hidro') or duration_min in (45, 60));

-- ---------------------------------------------------------------------
-- 4. Índices
-- ---------------------------------------------------------------------
create unique index if not exists students_email_uq on public.students (lower(email)) where email is not null;
create index if not exists student_plans_student_id_idx       on public.student_plans (student_id);
create index if not exists student_plans_start_date_idx       on public.student_plans (start_date);
create index if not exists trial_bookings_slot_id_on_date_idx on public.trial_bookings (slot_id, on_date);
create index if not exists attendance_student_id_check_in_idx on public.attendance (student_id, check_in);
create index if not exists attendance_check_in_idx            on public.attendance (check_in);
create index if not exists absences_student_id_idx            on public.absences (student_id);

-- ---------------------------------------------------------------------
-- 5. Funções de apoio às políticas de acesso (RLS)
-- ---------------------------------------------------------------------
create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = (select auth.uid()))
$$;

create or replace function private.my_student_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.students where user_id = (select auth.uid())
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_staff(), private.my_student_id() to authenticated;

-- ---------------------------------------------------------------------
-- 6. Row Level Security: equipe acessa tudo; aluno vê só os próprios dados
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['modalities', 'staff', 'class_slots', 'blocked_dates', 'students',
                           'student_plans', 'trial_bookings', 'attendance', 'absences', 'profiles'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated
                    using ((select private.is_staff())) with check ((select private.is_staff()))', t);
  end loop;
end $$;

drop policy if exists pub_mod  on public.modalities;
drop policy if exists pub_slots on public.class_slots;
create policy pub_mod   on public.modalities  for select to anon, authenticated using (true);
create policy pub_slots on public.class_slots for select to anon using (active);

drop policy if exists own_student on public.students;
drop policy if exists own_plans   on public.student_plans;
drop policy if exists own_att     on public.attendance;
drop policy if exists own_abs     on public.absences;
drop policy if exists own_profile on public.profiles;
drop policy if exists own_profile_update on public.profiles;
create policy own_student on public.students      for select to authenticated using (user_id = (select auth.uid()));
create policy own_plans   on public.student_plans for select to authenticated using (student_id = (select private.my_student_id()));
create policy own_att     on public.attendance    for select to authenticated using (student_id = (select private.my_student_id()));
create policy own_abs     on public.absences      for select to authenticated using (student_id = (select private.my_student_id()));
create policy own_profile on public.profiles      for select to authenticated using (id = (select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.modalities, public.class_slots to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------------------------------------------------------------------
-- 7. Agendamento experimental (SECURITY DEFINER: o visitante conta vagas sem ler dados de outros)
-- ---------------------------------------------------------------------
create or replace function public.available_slots(p_modality text, p_date date, p_age text)
returns table (slot_id uuid, start_time time, duration_min int, spots_left int)
language sql stable security definer set search_path = '' as $$
  select s.id, s.start_time, s.duration_min,
         s.capacity - (select count(*) from public.trial_bookings b
                       where b.slot_id = s.id and b.on_date = p_date and b.status <> 'cancelada')::int
  from public.class_slots s
  join public.modalities m on m.id = s.modality_id
  where s.modality_id = p_modality
    and m.trial and s.active
    and s.weekday = extract(dow from p_date)
    -- só natação e hidroginástica filtram a duração pela faixa etária
    and (not m.age_rule or s.duration_min = (case when p_age in ('crianca', 'idoso') then 45 else 60 end))
    and not exists (select 1 from public.blocked_dates d
                    where d.on_date = p_date and (d.modality_id is null or d.modality_id = s.modality_id))
    and (p_date > (now() at time zone 'America/Sao_Paulo')::date
         or (p_date = (now() at time zone 'America/Sao_Paulo')::date
             and s.start_time > (now() at time zone 'America/Sao_Paulo')::time))
  order by s.start_time
$$;

create or replace function public.book_trial(
  p_name text, p_phone text, p_email text, p_slot uuid, p_date date, p_age text, p_notes text
) returns json
language plpgsql security definer set search_path = '' as $$
declare
  s       public.class_slots;
  m       public.modalities;
  need    int;
  new_id  uuid;
begin
  -- trava a turma durante a reserva: impede overbooking
  select * into s from public.class_slots c where c.id = p_slot and c.active for update;
  if not found then raise exception 'Horário indisponível'; end if;

  select * into m from public.modalities x where x.id = s.modality_id;
  if not m.trial then raise exception 'Esta modalidade não tem aula experimental'; end if;
  if p_age not in ('crianca', 'adulto', 'idoso') then raise exception 'Faixa etária inválida'; end if;

  need := case when not m.age_rule then s.duration_min
               when p_age in ('crianca', 'idoso') then 45
               else 60 end;
  if s.duration_min <> need then raise exception 'Duração incompatível com a faixa etária'; end if;

  if extract(dow from p_date) <> s.weekday
     or p_date < (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Data inválida';
  end if;

  if exists (select 1 from public.blocked_dates d
             where d.on_date = p_date and (d.modality_id is null or d.modality_id = s.modality_id)) then
    raise exception 'Data bloqueada';
  end if;

  if length(trim(p_name)) < 3 or length(p_phone) < 8 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Confira nome, telefone e e-mail';
  end if;

  if (select count(*) from public.trial_bookings b
      where b.slot_id = s.id and b.on_date = p_date and b.status <> 'cancelada') >= s.capacity then
    raise exception 'Turma lotada';
  end if;

  if exists (select 1 from public.trial_bookings b
             where lower(b.email) = lower(p_email) and b.slot_id = s.id
               and b.on_date = p_date and b.status <> 'cancelada') then
    raise exception 'Este e-mail já reservou esta turma';
  end if;

  insert into public.trial_bookings (name, phone, email, modality_id, slot_id, on_date, age_group, duration_min, notes)
  values (trim(p_name), p_phone, trim(p_email), s.modality_id, s.id, p_date, p_age, need, p_notes)
  returning trial_bookings.id into new_id;

  return json_build_object('id', new_id, 'modality', m.name, 'date', p_date, 'time', s.start_time, 'duration', need);
end $$;

revoke execute on function public.available_slots, public.book_trial from public;
grant  execute on function public.available_slots, public.book_trial to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Converter interessado em aluno (reaproveita o aluno do mesmo e-mail)
-- ---------------------------------------------------------------------
create or replace function public.convert_to_student(p_booking uuid, p_kind text, p_start date)
returns uuid language plpgsql set search_path = '' as $$
declare
  b    public.trial_bookings;
  sid  uuid;
begin
  select * into b from public.trial_bookings t where t.id = p_booking for update;
  if not found then raise exception 'Agendamento não encontrado'; end if;

  select st.id into sid from public.students st where lower(st.email) = lower(b.email);
  if sid is null then
    insert into public.students (name, phone, email) values (b.name, b.phone, b.email)
    returning students.id into sid;
  end if;

  insert into public.student_plans (student_id, kind, modality_ids, start_date, end_date)
  values (sid, p_kind, array[b.modality_id], p_start,
          (p_start + case p_kind when 'anual' then interval '1 year' else interval '1 month' end)::date);

  update public.trial_bookings set student_id = sid, lead_status = 'plano_contratado' where id = p_booking;
  return sid;
end $$;

revoke execute on function public.convert_to_student from public;
grant  execute on function public.convert_to_student to authenticated;

-- ---------------------------------------------------------------------
-- 9. Vincular a conta do aluno ao cadastro pelo e-mail (sem exigir confirmação de e-mail)
-- ---------------------------------------------------------------------
create or replace function public.link_student() returns boolean
language plpgsql security definer set search_path = '' as $$
declare em text;
begin
  select u.email into em from auth.users u where u.id = (select auth.uid());
  if em is null then return false; end if;

  update public.students s set user_id = (select auth.uid())
  where lower(s.email) = lower(em) and s.user_id is null;

  return exists (select 1 from public.students s where s.user_id = (select auth.uid()));
end $$;

revoke execute on function public.link_student from public;
grant  execute on function public.link_student to authenticated;

-- ---------------------------------------------------------------------
-- 10. Contas do site: toda conta criada em Authentication já aparece em public.profiles
-- ---------------------------------------------------------------------
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Contas que já existiam antes desta versão
insert into public.profiles (id, email, name)
select id, email, coalesce(raw_user_meta_data ->> 'name', '') from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 11. Todo plano precisa de ao menos uma modalidade
-- ---------------------------------------------------------------------
create or replace function private.exigir_modalidade() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.modality_ids is null or cardinality(new.modality_ids) = 0 then
    raise exception 'Escolha ao menos uma modalidade';
  end if;
  return new;
end $$;

drop trigger if exists exigir_modalidade on public.student_plans;
create trigger exigir_modalidade
  before insert or update of modality_ids on public.student_plans
  for each row execute function private.exigir_modalidade();

-- ---------------------------------------------------------------------
-- 12. Assinatura de plano pelo site (pagamento SIMULADO no front-end)
-- Cria o aluno (ou reaproveita o do mesmo e-mail) e o plano ativo, que já aparecem no painel da equipe.
-- ATENÇÃO: enquanto o pagamento for simulado, qualquer pessoa consegue chamar esta função.
-- Antes de usar de verdade, troque por um fluxo com gateway de pagamento que confirme a cobrança no servidor.
-- ---------------------------------------------------------------------
create or replace function public.subscribe_plan(
  p_name text, p_email text, p_phone text, p_kind text, p_modalities text[]
) returns json
language plpgsql security definer set search_path = '' as $$
declare
  sid     uuid;
  pid     uuid;
  inicio  date;
  fim     date;
begin
  if length(trim(p_name)) < 3 or length(p_phone) < 8 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Confira nome, telefone e e-mail';
  end if;
  if p_kind not in ('mensal', 'anual') then raise exception 'Plano inválido'; end if;
  if p_modalities is null or cardinality(p_modalities) = 0 then
    raise exception 'Escolha ao menos uma modalidade';
  end if;
  if exists (select 1 from unnest(p_modalities) m where m not in (select id from public.modalities)) then
    raise exception 'Modalidade inválida';
  end if;

  inicio := (now() at time zone 'America/Sao_Paulo')::date;
  fim := (inicio + case p_kind when 'anual' then interval '1 year' else interval '1 month' end)::date;

  select st.id into sid from public.students st where lower(st.email) = lower(trim(p_email));
  if sid is null then
    insert into public.students (name, phone, email) values (trim(p_name), p_phone, trim(p_email))
    returning students.id into sid;
  end if;

  insert into public.student_plans (student_id, kind, modality_ids, start_date, end_date, status)
  values (sid, p_kind, p_modalities, inicio, fim, 'ativo')
  returning student_plans.id into pid;

  -- Se a pessoa já tinha feito aula experimental com este e-mail, o funil passa a "plano contratado"
  update public.trial_bookings set student_id = sid, lead_status = 'plano_contratado'
  where lower(email) = lower(trim(p_email)) and student_id is null;

  return json_build_object('student_id', sid, 'plan_id', pid, 'kind', p_kind, 'start', inicio, 'end', fim);
end $$;

revoke execute on function public.subscribe_plan from public;
grant  execute on function public.subscribe_plan to anon, authenticated;

-- ---------------------------------------------------------------------
-- Depois de rodar: crie o usuário em Authentication > Users e libere-o como equipe:
--   insert into public.staff (user_id, name) values ('UUID-DO-USUARIO', 'Nome');
-- Horários de exemplo (weekday 0 = domingo):
--   insert into public.class_slots (modality_id, weekday, start_time, duration_min)
--   values ('natacao', 1, '08:00', 60), ('natacao', 1, '09:15', 45), ('pilates', 2, '18:00', 50);
-- ---------------------------------------------------------------------
