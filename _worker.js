export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/contact') {
      return handleContactSubmission(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleContactSubmission(request, env) {
  if (!env.CONTACT_FORMS) {
    return json({ ok: false, message: 'Das Kontaktformular ist noch nicht vollständig eingerichtet.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: 'Ungültige Anfrage.' }, 400);
  }

  const data = {
    name: clean(payload.name),
    company: clean(payload.company),
    email: clean(payload.email).toLowerCase(),
    topic: clean(payload.topic),
    message: clean(payload.message),
    consent: payload.consent === true,
    assessment: clean(payload.assessment)
  };

  if (!data.name) {
    return json({ ok: false, message: 'Bitte den Namen angeben.' }, 400);
  }

  if (!isValidEmail(data.email)) {
    return json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, 400);
  }

  if (!data.consent) {
    return json({ ok: false, message: 'Bitte die Datenschutzhinweise bestätigen.' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const rateKey = `contact-rate:${ip}`;
  const lastSubmission = await env.CONTACT_FORMS.get(rateKey);
  if (lastSubmission && Date.now() - Number(lastSubmission) < 60_000) {
    return json({ ok: false, message: 'Bitte warten Sie einen Moment, bevor Sie eine weitere Anfrage senden.' }, 429);
  }

  const submittedAt = new Date().toISOString();
  const entryId = `contact:${submittedAt}:${crypto.randomUUID()}`;
  const record = {
    id: entryId,
    submittedAt,
    ip,
    userAgent,
    ...data
  };

  await Promise.all([
    env.CONTACT_FORMS.put(entryId, JSON.stringify(record)),
    env.CONTACT_FORMS.put(rateKey, String(Date.now()), { expirationTtl: 120 })
  ]);

  return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 200);
}

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
