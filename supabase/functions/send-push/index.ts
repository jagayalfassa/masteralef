// AlefMaster — Edge Function: send-push (v3: tag por mensaje + destino al tocar)
// Copia de referencia de lo desplegado en Supabase (versión 7).
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC   = (Deno.env.get('VAPID_PUBLIC_KEY') ?? '').trim();
const VAPID_PRIVATE  = (Deno.env.get('VAPID_PRIVATE_KEY') ?? '').trim();
const WEBHOOK_SECRET = (Deno.env.get('PUSH_WEBHOOK_SECRET') ?? '').trim();

let vapidError = '';
try {
  webpush.setVapidDetails('mailto:contacto@alefmaster.com', VAPID_PUBLIC, VAPID_PRIVATE);
} catch (e) {
  vapidError = (e as Error).message;
}

// A dónde lleva la notificación al tocarla (lo resuelve index.html con ?open=)
function openTarget(type: string): string {
  if (type === 'teacher') return './?open=chat';   // alumno → conversación con el moré
  if (type === 'student') return './?open=inbox';  // docente → panel con la consulta
  return './';
}

Deno.serve(async (req) => {
  try {
    if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }
    if (vapidError) {
      return new Response('config VAPID inválida: ' + vapidError, { status: 200 });
    }

    const payload = await req.json();
    const record = payload?.record;
    if (!record || !record.user_id) return new Response('sin record', { status: 200 });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', record.user_id);

    if (!subs || subs.length === 0) return new Response('sin suscripciones', { status: 200 });

    const rawBody = String(record.body || '¡Tenés un mensaje nuevo! 📩');
    const body = JSON.stringify({
      title: record.title || 'AlefMaster',
      body:  rawBody.length > 180 ? rawBody.slice(0, 177) + '…' : rawBody,
      icon:  'https://alefmaster.com/icons/icon-192.png',
      tag:   'msg-' + (record.id || Date.now()),
      url:   openTarget(record.type || ''),
      type:  record.type || null,
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60 * 24 * 3 },
        )
      )
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const code = r.status === 'rejected' ? ((r.reason as { statusCode?: number })?.statusCode ?? 0) : 0;
      if (code === 404 || code === 410) {
        await sb.from('push_subscriptions').delete().eq('endpoint', subs[i].endpoint);
      }
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: subs.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('error: ' + (e as Error).message, { status: 500 });
  }
});
