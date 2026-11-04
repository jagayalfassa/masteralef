-- AlefMaster — chat docente ↔ alumno (notifications)
-- Pegar entero en Supabase → SQL Editor → Run. Es idempotente y compatible
-- con la versión publicada de la app.
begin;

alter table public.notifications
  add column if not exists sender_id uuid references auth.users(id) on delete set null,
  add column if not exists read_at   timestamptz,
  add column if not exists context   jsonb;
alter table public.notifications alter column sender_id set default auth.uid();
create index if not exists notifications_user_created_idx   on public.notifications (user_id, created_at desc);
create index if not exists notifications_sender_created_idx on public.notifications (sender_id, created_at desc);

-- read_at automático + el destinatario solo puede cambiar "read"
create or replace function private.notifications_guard_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.user_id    := old.user_id;
    new.sender_id  := old.sender_id;
    new.title      := old.title;
    new.body       := old.body;
    new.type       := old.type;
    new.context    := old.context;
    new.created_at := old.created_at;
  end if;
  if new.read is true and old.read is distinct from true then
    new.read_at := coalesce(new.read_at, now());
  elsif new.read is not true then
    new.read_at := null;
  end if;
  return new;
end $$;
drop trigger if exists notifications_guard_update on public.notifications;
create trigger notifications_guard_update before update on public.notifications
  for each row execute function private.notifications_guard_update();

-- Lectura: lo que recibo y lo que envié
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications
  for select using (auth.uid() = user_id or auth.uid() = sender_id);

-- Envío directo: solo docente → alumno de sus clases
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications
  for insert with check (
    sender_id = auth.uid() and type = 'teacher'
    and exists (select 1 from public.class_members cm
                where cm.student_id = notifications.user_id
                  and private.is_class_teacher(cm.class_id)));

-- Alumno → docente: guarda remitente y contexto del ejercicio
drop function if exists public.student_message_teacher(text);
create or replace function public.student_message_teacher(p_body text, p_context jsonb default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_count int := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_authenticated'); end if;
  if p_body is null or length(trim(p_body)) = 0 then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  if length(trim(p_body)) > 1000 then return jsonb_build_object('ok', false, 'reason', 'too_long'); end if;
  if p_context is not null and length(p_context::text) > 4000 then p_context := null; end if;
  select coalesce(nullif(trim(name), ''), 'Un alumno') into v_name from public.profiles where id = v_uid;
  with teachers as (
    select distinct c.teacher_id as tid from public.class_members cm
      join public.classes c on c.id = cm.class_id
     where cm.student_id = v_uid and c.teacher_id is not null
    union
    select distinct ct.teacher_id as tid from public.class_members cm
      join public.class_teachers ct on ct.class_id = cm.class_id
     where cm.student_id = v_uid
  )
  insert into public.notifications (user_id, sender_id, title, body, type, read, context, created_at)
  select tid, v_uid, '💬 ' || v_name || ' tiene una consulta', trim(p_body), 'student', false, p_context, now()
    from teachers;
  get diagnostics v_count = row_count;
  if v_count = 0 then return jsonb_build_object('ok', false, 'reason', 'no_class'); end if;
  return jsonb_build_object('ok', true, 'teachers', v_count);
end;
$function$;
revoke all on function public.student_message_teacher(text, jsonb) from public;
grant execute on function public.student_message_teacher(text, jsonb) to authenticated;

-- Backfill de mensajes existentes
update public.notifications n set sender_id = coalesce(
    (select c.teacher_id from public.class_members cm join public.classes c on c.id = cm.class_id
      where cm.student_id = n.user_id order by cm.joined_at limit 1),
    (select c.teacher_id from public.classes c order by c.created_at limit 1))
 where n.type = 'teacher' and n.sender_id is null;
update public.notifications n set sender_id = (
    select p.id from public.profiles p
     where p.role = 'student'
       and '💬 ' || coalesce(nullif(trim(p.name),''),'Un alumno') || ' tiene una consulta' = n.title
     order by p.created_at limit 1)
 where n.type = 'student' and n.sender_id is null;
update public.notifications set read_at = created_at where read and read_at is null;

commit;

-- Verificación: con_remitente debería igualar a total en teacher y student
select type, count(*) total, count(sender_id) con_remitente from public.notifications group by type;
