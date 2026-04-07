const N8N_WEBHOOK_URL = 'https://maxde.app.n8n.cloud/webhook/cloudflare-contact';

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
    gender: clean(payload.gender),
    firstName: clean(payload.firstName),
    name: clean(payload.name),
    company: clean(payload.company),
    email: clean(payload.email).toLowerCase(),
    topic: clean(payload.topic),
    message: clean(payload.message),
    phone: clean(payload.phone),
    callbackRequested: payload.callbackRequested === true,
    consent: payload.consent === true,
    assessment: clean(payload.assessment),
    website: clean(payload.website)
  };

  if (data.website) {
    return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 202);
  }

  if (!data.gender || !['male', 'female', 'diverse'].includes(data.gender)) {
    return json({ ok: false, message: 'Bitte eine gültige Anrede auswählen.' }, 400);
  }

  if (!data.firstName) {
    return json({ ok: false, message: 'Bitte den Vornamen angeben.' }, 400);
  }

  if (!data.name) {
    return json({ ok: false, message: 'Bitte den Nachnamen angeben.' }, 400);
  }

  if (!isValidEmail(data.email)) {
    return json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, 400);
  }

  if (data.callbackRequested && !isValidPhone(data.phone)) {
    return json({ ok: false, message: 'Bitte eine Telefonnummer für den Rückruf angeben.' }, 400);
  }

  if (!data.consent) {
    return json({ ok: false, message: 'Bitte die Datenschutzhinweise bestätigen.' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const rateKey = `contact-rate:${ip}`;
  const lastSubmission = await env.CONTACT_FORMS.get(rateKey);

  if (lastSubmission && Date.now() - Number(lastSubmission) < 60000) {
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

  try {
    await sendToN8N(record);
  } catch {
    return json(
      {
        ok: false,
        message: 'Anfrage wurde gespeichert, aber die E-Mail-Weiterleitung hat nicht funktioniert.'
      },
      502
    );
  }

  return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 200);
}

async function sendToN8N(record) {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`n8n error ${response.status}: ${text}`);
  }
}

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function isValidPhone(value) {
  const normalized = String(value || '').trim().replace(/[^\d+]/g, '');
  return normalized.length >= 7;
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
