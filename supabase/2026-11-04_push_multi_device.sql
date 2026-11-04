-- AlefMaster — push: varios dispositivos por usuario + registro seguro
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
begin;

-- Un usuario puede tener varios dispositivos; cada dispositivo (endpoint) es único
alter table public.push_subscriptions drop constraint if exists push_subscriptions_user_id_key;
create unique index if not exists push_subscriptions_endpoint_key on public.push_subscriptions (endpoint);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Registrar el dispositivo para el usuario actual. Si el mismo dispositivo
-- estaba asociado a otra cuenta (celular compartido / cambio de sesión),
-- pasa a la cuenta actual: los avisos de la cuenta anterior dejan de llegar ahí.
create or replace function public.register_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_authenticated'); end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000
     or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, updated_at)
  values (v_uid, p_endpoint, p_p256dh, p_auth, now())
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$function$;
revoke all on function public.register_push_subscription(text, text, text) from public;
grant execute on function public.register_push_subscription(text, text, text) to authenticated;

commit;

-- Verificación: debería listar push_subscriptions_endpoint_key y la función
select indexname from pg_indexes where tablename = 'push_subscriptions'
union all select 'fn: ' || proname from pg_proc where proname = 'register_push_subscription';
