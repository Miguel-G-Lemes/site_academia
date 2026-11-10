-- Grade de exemplo para as aulas experimentais (segunda a sexta). Edite os valores e rode no SQL Editor.
-- Pode rodar mais de uma vez: horários que já existem não são duplicados.
--   modalidade: musculacao, aerobico, natacao, pilates, danca ou hidro
--   duracao:    natação e hidroginástica só aceitam 45 (criança/idoso) ou 60 (adulto); as demais são livres
--   vagas:      limite de pessoas por aula
with grade (modalidade, hora, duracao, vagas) as (values
  ('musculacao', '07:00', 60, 12), ('musculacao', '18:00', 60, 12),
  ('aerobico',   '08:00', 45, 15), ('aerobico',   '19:00', 45, 15),
  ('natacao',    '08:00', 60,  6), ('natacao',    '09:15', 45,  6), ('natacao', '18:00', 60, 6),
  ('pilates',    '09:00', 50,  5), ('pilates',    '18:30', 50,  5),
  ('danca',      '19:30', 60, 20),
  ('hidro',      '10:00', 60,  8), ('hidro',      '11:15', 45,  8)
),
dias (dia) as (values (1), (2), (3), (4), (5))   -- 0 = domingo, 1 = segunda ... 6 = sábado
insert into public.class_slots (modality_id, weekday, start_time, duration_min, capacity)
select g.modalidade, d.dia, g.hora::time, g.duracao, g.vagas
from grade g cross join dias d
where not exists (
  select 1 from public.class_slots s
  where s.modality_id = g.modalidade and s.weekday = d.dia
    and s.start_time = g.hora::time and s.duration_min = g.duracao
);

-- Conferir o que o site vai mostrar para uma modalidade em uma data (troque a data por um dia útil futuro):
-- select * from public.available_slots('pilates', '2026-11-10', 'adulto');
