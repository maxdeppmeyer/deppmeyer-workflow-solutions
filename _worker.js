const DEFAULT_CONTACT_TTL_SECONDS = 60 * 60 * 24 * 90;
const DEFAULT_CHAT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_CHAT_RATE_LIMIT_MAX_REQUESTS = 8;
const DEFAULT_CHAT_MODEL = 'gpt-4.1-mini';

const CHAT_FALLBACK_MESSAGE = 'Dazu kann ich hier keine verlässliche Antwort geben. Der Assistent ist auf allgemeine Fragen zur Webseite und auf digitale Abläufe, Automatisierung, interne Tools, Formulare, PDFs, OCR, Workflows, Schnittstellen und Prozessoptimierung begrenzt. Wenn es um einen konkreten Ablauf in deinem Unternehmen geht, beschreibe ihn bitte kurz im Kontaktformular: kontakt.html#kontaktformular';

const CHAT_WEBSITE_CONTEXT = `
Wichtige Seiten und erlaubte Links der Webseite:
- Startseite / Überblick: index.html#hero
- FAQ und weitere Fragen: index.html#faq
- Schnellcheck für Abläufe: index.html#workflow-check
- Leistungen allgemein: leistungen.html#leistungen-ueberblick
- Interne Apps und kleine Business-Tools: leistungen.html#apps
- Workflow-Automatisierung: leistungen.html#automatisierung
- OCR und Dokumentenverarbeitung: leistungen.html#ocr
- PDF-Erstellung, Rechnungen, Angebote und Nachweise: leistungen.html#pdf
- Schnittstellen und Datenübertragung: leistungen.html#schnittstellen
- Analyse und Planung: leistungen.html#analyse
- Praxisbeispiele und animierte Abläufe: beispiele.html#animierte-ablaeufe
- Beispiel Schlüsseldienst-App: beispiele.html#beispiel-schluesseldienst-app
- Einsatzbereiche: einsatzbereiche.html#einsatz-ueberblick
- Arbeitsweise / Über mich: ueber-mich.html#arbeitsweise
- Kontaktformular: kontakt.html#kontaktformular
`;

const CHAT_SYSTEM_PROMPT = `Du bist der begrenzte Website-Assistent von Deppmeyer Workflow Solutions.

Deine Aufgabe:
Du beantwortest allgemeine Fragen zur Webseite und hilfst Besuchern dabei, grob einzuschätzen, ob sich ein manueller, wiederkehrender oder unübersichtlicher Geschäftsprozess digitalisieren oder automatisieren lässt.

Erlaubte Themen:
- Fragen zur Webseite, zu Leistungen, Beispielen, Einsatzbereichen, Arbeitsweise und Kontakt
- kurze höfliche Smalltalk-Fragen wie Begrüßung, Danke oder „Wie geht es dir?“
- Automatisierung von Arbeitsabläufen
- interne Web-Apps und kleine Business-Tools
- Formulare, Datenerfassung und digitale Eingaben
- PDF-Erstellung, Rechnungen, Angebote und Nachweise
- OCR und Dokumentenverarbeitung
- E-Mail-Workflows, Postfach-Logik und automatische Benachrichtigungen
- Excel-Listen, Datenzusammenführung und Dashboards
- Schnittstellen zwischen Tools
- Prozessoptimierung im Unternehmensalltag
- grobe Lösungswege und sinnvolle nächste Schritte
- allgemeine Preisfragen ohne konkrete Preisangaben

Nicht erlaubt:
- medizinische, rechtliche oder finanzielle Beratung
- politische, private oder beliebige allgemeine Weltfragen
- Programmieraufträge mit vollständigem produktionsreifem Code
- konkrete Preisversprechen
- feste Zeit- oder Erfolgsgarantien
- Behauptungen über Möglichkeiten, wenn wichtige Informationen fehlen
- erfundene Referenzen, Projekte, Zertifikate oder Kundennamen
- erfundene Links, Seiten oder Website-Inhalte

Antwortregeln:
- Antworte auf Deutsch.
- Bleibe kurz, konkret und verständlich.
- Gib maximal 4 kurze Absätze oder eine kurze Liste aus.
- Erkläre nur grobe Lösungswege, keine verbindlichen Zusagen.
- Wenn Informationen fehlen, stelle höchstens 2 sinnvolle Rückfragen.
- Bei Preisfragen: Erkläre, dass Preise individuell nach Projektumfang, Komplexität, Schnittstellen, Datenmenge, Design-/App-Aufwand und gewünschtem Ergebnis kalkuliert werden. Verweise für konkrete Preisfragen auf kontakt.html#kontaktformular.
- Bei Smalltalk: Antworte freundlich kurz und lenke danach wieder auf digitale Abläufe oder Fragen zur Webseite.
- Wenn eine Frage nicht in die erlaubten Themen passt, lehne freundlich ab und verweise auf kontakt.html#kontaktformular.
- Wenn du unsicher bist, sage das klar und verweise auf kontakt.html#kontaktformular.
- Keine erfundenen Details.
- Keine HTML-Ausgabe, kein Markdown mit Tabellen.
- Wenn es zur Antwort passt, füge am Ende „Siehe auch:“ mit 1 bis 3 passenden Links aus der folgenden Website-Liste hinzu. Nutze nur exakt diese Linkpfade und erfinde keine anderen Anker.

${CHAT_WEBSITE_CONTEXT}`;

const CHAT_TOPIC_KEYWORDS = [
  'ablauf', 'abläufe', 'prozess', 'prozesse', 'workflow', 'workflows', 'automatis', 'digitalis', 'manuell', 'nacharbeit',
  'formular', 'formulare', 'e-mail', 'email', 'mail', 'postfach', 'benachrichtigung', 'antwort', 'anfrage', 'kundenanfrage',
  'excel', 'liste', 'listen', 'csv', 'daten', 'dashboard', 'auswertung', 'report', 'tabelle', 'datenbank',
  'pdf', 'rechnung', 'rechnungen', 'angebot', 'angebote', 'nachweis', 'dokument', 'dokumente', 'ocr', 'scan', 'foto',
  'app', 'apps', 'web-app', 'tool', 'software', 'internes system', 'kundenportal', 'formularstrecke',
  'schnittstelle', 'api', 'import', 'export', 'zapier', 'make', 'n8n', 'cloudflare',
  'termin', 'termine', 'kalender', 'rückmeldung', 'status', 'übergabe', 'auftrag', 'aufträge', 'disposition',
  'leistung', 'leistungen', 'beispiel', 'beispiele', 'einsatzbereich', 'einsatzbereiche', 'webseite', 'seite', 'kontakt',
  'preis', 'preise', 'kosten', 'kostet', 'budget', 'stundensatz', 'pauschale', 'abrechnung',
  'hallo', 'hi', 'hey', 'moin', 'guten tag', 'guten morgen', 'guten abend', 'wie geht', 'danke', 'dankeschön'
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat') {
      if (request.method === 'OPTIONS') {
        return handleOptions(request, env);
      }

      if (request.method === 'POST') {
        return handleChatRequest(request, env, ctx);
      }

      return json({ ok: false, message: 'Methode nicht erlaubt.' }, 405, corsHeaders(request, env));
    }

    if (request.method === 'POST' && url.pathname === '/api/contact') {
      return handleContactSubmission(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleChatRequest(request, env, ctx) {
  const headers = corsHeaders(request, env);

  if (!env.OPENAI_API_KEY) {
    return json({ ok: false, message: 'Der Chat-Assistent ist noch nicht vollständig eingerichtet.' }, 500, headers);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: 'Ungültige Anfrage.' }, 400, headers);
  }

  const messages = normalizeChatMessages(payload.messages);
  if (!messages.length) {
    const singleMessage = cleanMultiline(payload.message, 1200);
    if (singleMessage) {
      messages.push({ role: 'user', content: singleMessage });
    }
  }

  const latestMessage = messages.at(-1)?.content || '';

  if (!latestMessage || latestMessage.length < 3) {
    return json({ ok: false, message: 'Bitte stelle eine kurze Frage zu deinem Ablauf.' }, 400, headers);
  }

  if (latestMessage.length > 1200) {
    return json({ ok: false, message: 'Bitte fasse die Frage etwas kürzer zusammen.' }, 400, headers);
  }

  if (!isAllowedChatTopic(messages)) {
    return json({ ok: true, reply: CHAT_FALLBACK_MESSAGE, limited: true }, 200, headers);
  }

  const rateLimitResponse = await checkChatRateLimit(request, env, headers);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const openAiPayload = {
    model: clean(env.OPENAI_MODEL, 80) || DEFAULT_CHAT_MODEL,
    input: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...messages.map((message) => ({ role: message.role, content: message.content }))
    ],
    temperature: 0.25,
    max_output_tokens: 650
  };

  let aiResponse;
  try {
    aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openAiPayload)
    });
  } catch {
    return json({ ok: false, message: 'Der Assistent ist gerade nicht erreichbar. Bitte versuche es später erneut oder nutze das Kontaktformular.' }, 502, headers);
  }

  if (!aiResponse.ok) {
    return json({ ok: false, message: 'Der Assistent konnte gerade keine Antwort erstellen. Bitte nutze alternativ das Kontaktformular.' }, 502, headers);
  }

  let result;
  try {
    result = await aiResponse.json();
  } catch {
    return json({ ok: false, message: 'Die Antwort des Assistenten konnte nicht verarbeitet werden.' }, 502, headers);
  }

  const reply = cleanAiReply(extractOpenAiText(result));

  if (!reply) {
    return json({ ok: true, reply: CHAT_FALLBACK_MESSAGE, limited: true }, 200, headers);
  }

  const chatRecord = buildChatRecord(request, messages, reply);
  if (env.N8N_CHAT_WEBHOOK_URL && ctx?.waitUntil) {
    ctx.waitUntil(sendChatToN8N(chatRecord, env.N8N_CHAT_WEBHOOK_URL, env.N8N_CHAT_SECRET).catch(() => {}));
  }

  return json({ ok: true, reply }, 200, headers);
}

function normalizeChatMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-8)
    .map((message) => {
      const role = message?.role === 'assistant' ? 'assistant' : 'user';
      const content = cleanMultiline(message?.content, 1200);
      return { role, content };
    })
    .filter((message) => message.content.length > 0);
}

function isAllowedChatTopic(messages) {
  const userMessages = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content.toLowerCase());

  const latest = userMessages.at(-1) || '';
  const hasAllowedKeyword = (text) => CHAT_TOPIC_KEYWORDS.some((keyword) => text.includes(keyword));

  if (hasAllowedKeyword(latest)) {
    return true;
  }

  const isFollowUp = [
    'mehr', 'genauer', 'erklär', 'erklaer', 'wie genau', 'warum', 'was bedeutet',
    'nächster schritt', 'naechster schritt', 'weiter', 'ok', 'okay', 'ja'
  ].some((keyword) => latest.includes(keyword));

  if (!isFollowUp) {
    return false;
  }

  return hasAllowedKeyword(userMessages.slice(0, -1).join(' '));
}

async function checkChatRateLimit(request, env, headers) {
  if (!env.CONTACT_FORMS) return null;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const windowSeconds = parsePositiveInteger(env.CHAT_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_CHAT_RATE_LIMIT_WINDOW_SECONDS);
  const maxRequests = parsePositiveInteger(env.CHAT_RATE_LIMIT_MAX_REQUESTS, DEFAULT_CHAT_RATE_LIMIT_MAX_REQUESTS);
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const rateKey = `chat-rate:${ip}:${windowId}`;
  const currentCount = Number(await env.CONTACT_FORMS.get(rateKey) || '0');

  if (currentCount >= maxRequests) {
    return json({ ok: false, message: 'Bitte warte kurz, bevor du weitere Fragen stellst.' }, 429, headers);
  }

  await env.CONTACT_FORMS.put(rateKey, String(currentCount + 1), { expirationTtl: windowSeconds + 30 });
  return null;
}

function extractOpenAiText(result) {
  if (typeof result?.output_text === 'string') {
    return result.output_text;
  }

  if (!Array.isArray(result?.output)) {
    return '';
  }

  return result.output
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .map((content) => content?.text || '')
    .join('\n')
    .trim();
}

function cleanAiReply(value) {
  return cleanMultiline(value, 1800)
    .replace(/<[^>]*>/g, '')
    .trim();
}

function buildChatRecord(request, messages, reply) {
  return {
    id: `chat:${new Date().toISOString()}:${crypto.randomUUID()}`,
    submittedAt: new Date().toISOString(),
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    userAgent: request.headers.get('User-Agent') || '',
    origin: request.headers.get('Origin') || '',
    source: 'website-chat-assistant',
    messages,
    reply
  };
}

async function sendChatToN8N(record, webhookUrl, secret) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (secret) {
    headers['X-Chat-Secret'] = secret;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(record)
  });
}

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
    gender: clean(payload.gender, 40),
    firstName: clean(payload.firstName, 80),
    name: clean(payload.name, 80),
    company: clean(payload.company, 120),
    email: clean(payload.email, 160).toLowerCase(),
    topic: clean(payload.topic, 140),
    message: cleanMultiline(payload.message, 4000),
    phone: clean(payload.phone, 80),
    callbackRequested: payload.callbackRequested === true,
    consent: payload.consent === true,
    assessment: cleanMultiline(payload.assessment, 1500),
    website: clean(payload.website, 200)
  };

  // Honeypot: echte Nutzer sehen dieses Feld nicht.
  if (data.website) {
    return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 202);
  }

  const allowedGenderValues = ['', 'male', 'female', 'other', 'diverse'];
  if (!allowedGenderValues.includes(data.gender)) {
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

  if (!data.topic) {
    return json({ ok: false, message: 'Bitte ein Thema auswählen.' }, 400);
  }

  if (!data.message || data.message.length < 20) {
    return json({ ok: false, message: 'Bitte den Ablauf kurz mit mindestens 20 Zeichen beschreiben.' }, 400);
  }

  if (data.callbackRequested && !isValidPhone(data.phone)) {
    return json({ ok: false, message: 'Bitte eine Telefonnummer für den Rückruf angeben.' }, 400);
  }

  if (!data.consent) {
    return json({ ok: false, message: 'Bitte die Datenschutzhinweise bestätigen.' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const origin = request.headers.get('Origin') || '';
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
    origin,
    source: 'website-contact-form',
    ...data
  };

  await Promise.all([
    env.CONTACT_FORMS.put(entryId, JSON.stringify(record), { expirationTtl: getContactTtl(env) }),
    env.CONTACT_FORMS.put(rateKey, String(Date.now()), { expirationTtl: 120 })
  ]);

  const webhookUrl = env.N8N_WEBHOOK_URL || 'https://maxde.app.n8n.cloud/webhook/cloudflare-contact';

  try {
    await sendToN8N(record, webhookUrl, env.N8N_CONTACT_SECRET);
  } catch {
    return json(
      {
        ok: false,
        message: 'Anfrage wurde gespeichert, aber die Weiterleitung an den Workflow hat nicht funktioniert.'
      },
      502
    );
  }

  return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 200);
}

async function sendToN8N(record, webhookUrl, secret) {
  if (!webhookUrl) {
    throw new Error('n8n webhook missing');
  }

  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (secret) {
    headers['X-Contact-Secret'] = secret;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`n8n error ${response.status}: ${text}`);
  }
}

function handleOptions(request, env) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env)
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const requestHost = new URL(request.url).origin;
  const allowedOrigin = clean(env.CHAT_ALLOWED_ORIGIN, 300) || requestHost;
  const responseOrigin = origin && origin === allowedOrigin ? origin : requestHost;

  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function clean(value, maxLength = 500) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function cleanMultiline(value, maxLength = 4000) {
  return String(value || '').trim().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function isValidPhone(value) {
  const normalized = String(value || '').trim().replace(/[^\d+]/g, '');
  return normalized.length >= 7;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function getContactTtl(env) {
  const parsed = Number(env.CONTACT_TTL_SECONDS || DEFAULT_CONTACT_TTL_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : DEFAULT_CONTACT_TTL_SECONDS;
}

function json(payload, status, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}
