const DEFAULT_CONTACT_TTL_SECONDS = 60 * 60 * 24 * 90;
const DEFAULT_CHAT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_CHAT_RATE_LIMIT_MAX_REQUESTS = 8;
const DEFAULT_CHAT_MODEL = 'gpt-4.1-mini';
const DEFAULT_CONTACT_MAX_BODY_BYTES = 25 * 1024;
const DEFAULT_CHAT_MAX_BODY_BYTES = 15 * 1024;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'; upgrade-insecure-requests"
};

const CHAT_FALLBACK_MESSAGE = 'Dazu kann ich hier keine sichere Einschätzung geben. Wenn es um eine digitale Lösung, Webseite, App, Automatisierung, PDF, OCR, Schnittstelle oder einen konkreten Ablauf geht, beschreibe den Bedarf bitte kurz über das Kontaktformular.';

const CHAT_SITE_LINKS = {
  'index.html#hero': 'Startseite öffnen',
  'index.html#faq': 'FAQ ansehen',
  'leistungen.html#leistungen-ueberblick': 'Leistungen ansehen',
  'leistungen.html#apps': 'Interne Apps ansehen',
  'leistungen.html#automatisierung': 'Workflow-Automatisierung ansehen',
  'leistungen.html#ocr': 'OCR & Dokumente ansehen',
  'leistungen.html#pdf': 'PDF-Erstellung ansehen',
  'leistungen.html#schnittstellen': 'Schnittstellen ansehen',
  'leistungen.html#analyse': 'Analyse & Planung ansehen',
  'beispiele.html#animierte-ablaeufe': 'Praxisbeispiele ansehen',
  'beispiele.html#beispiel-schluesseldienst-app': 'Schlüsseldienst-Beispiel ansehen',
  'einsatzbereiche.html#einsatz-ueberblick': 'Einsatzbereiche ansehen',
  'ueber-mich.html#arbeitsweise': 'Arbeitsweise ansehen',
  'kontakt.html#kontaktformular': 'Kontaktformular öffnen'
};

const CHAT_WEBSITE_CONTEXT = `
Wichtige Seiten und erlaubte Links der Webseite:
- Startseite / Überblick: index.html#hero
- FAQ und weitere Fragen: index.html#faq
- Leistungen allgemein: leistungen.html#leistungen-ueberblick
- Webseiten, Landingpages mit Funktion, interne Apps und kleine Business-Tools: leistungen.html#apps
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
- Webseiten, Landingpages mit Formularen oder geschäftlicher Funktion
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
- Sprich als Website-Assistent über Deppmeyer Workflow Solutions, nicht über dich als KI. Sage also nicht „ich selbst baue keine Webseiten“.
- Halte Antworten sehr kurz: meistens 2 bis 5 Sätze, maximal 90 Wörter.
- Nutze höchstens 3 kurze Aufzählungspunkte, wenn eine Liste wirklich hilft.
- Verneine digitale Lösungen nicht hart. Webseiten, Landingpages, Web-Apps, Formulare, Apps, Workflows, OCR, PDFs, Dashboards, Schnittstellen und Automatisierungen können grundsätzlich geprüft werden.
- Wenn etwas nicht der Hauptschwerpunkt ist, sage: „Das ist nicht der Hauptschwerpunkt, kann aber geprüft werden, wenn es zu einem geschäftlichen Ablauf oder Ziel passt.“
- Erkläre nur grobe Lösungswege, keine verbindlichen Zusagen.
- Wenn Informationen fehlen, stelle höchstens 1 kurze Rückfrage oder verweise auf kontakt.html#kontaktformular.
- Bei Preisfragen: Keine konkreten Preise nennen. Kurz sagen, dass Preise individuell nach Projektumfang, Komplexität, Schnittstellen, Datenmenge, Design-/App-Aufwand und gewünschtem Ergebnis kalkuliert werden. Immer auf kontakt.html#kontaktformular verweisen.
- Bei Smalltalk: Antworte freundlich in 1 bis 2 Sätzen und biete danach Hilfe zu digitalen Abläufen oder Fragen zur Webseite an.
- Wenn eine Frage nicht in die erlaubten Themen passt, lehne freundlich kurz ab und verweise auf kontakt.html#kontaktformular.
- Wenn du unsicher bist, sage das klar und verweise auf kontakt.html#kontaktformular.
- Keine erfundenen Details.
- Keine HTML-Ausgabe, keine Markdown-Tabellen und möglichst keine langen Markdown-Listen.
- Wenn es zur Antwort passt, füge am Ende einen Abschnitt „Siehe auch:“ mit 1 bis 3 wirklich unterschiedlichen Linkpfaden aus der folgenden Website-Liste hinzu. Nutze nur exakt diese Linkpfade und erfinde keine anderen Anker. Die Webseite stellt diese Links später als Buttons dar. Wähle nicht drei sehr ähnliche Links, wenn ein Kontaktformular-Link oder eine Beispielseite besser passt.

${CHAT_WEBSITE_CONTEXT}`;

const CHAT_TOPIC_KEYWORDS = [
  'ablauf', 'abläufe', 'prozess', 'prozesse', 'workflow', 'workflows', 'automatis', 'digitalis', 'manuell', 'nacharbeit',
  'formular', 'formulare', 'e-mail', 'email', 'mail', 'postfach', 'benachrichtigung', 'antwort', 'anfrage', 'kundenanfrage',
  'excel', 'liste', 'listen', 'csv', 'daten', 'dashboard', 'auswertung', 'report', 'tabelle', 'datenbank',
  'pdf', 'rechnung', 'rechnungen', 'angebot', 'angebote', 'nachweis', 'dokument', 'dokumente', 'ocr', 'scan', 'foto',
  'app', 'apps', 'web-app', 'webapp', 'website', 'webseite', 'webseiten', 'landingpage', 'landingpages', 'homepage', 'internetauftritt', 'tool', 'software', 'internes system', 'kundenportal', 'formularstrecke',
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
        return handleOptions(request, env, 'chat');
      }

      if (request.method === 'POST') {
        return handleChatRequest(request, env, ctx);
      }

      return json({ ok: false, message: 'Methode nicht erlaubt.' }, 405, corsHeaders(request, env, 'chat'));
    }

    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') {
        return handleOptions(request, env, 'contact');
      }

      if (request.method === 'POST') {
        return handleContactSubmission(request, env);
      }

      return json({ ok: false, message: 'Methode nicht erlaubt.' }, 405, corsHeaders(request, env, 'contact'));
    }

    const response = await env.ASSETS.fetch(request);
    return withSecurityHeaders(response, request);
  }
};


function withSecurityHeaders(response, request) {
  const next = new Response(response.body, response);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => next.headers.set(key, value));

  const url = new URL(request.url);
  if (url.protocol === 'https:') {
    next.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return next;
}

async function handleChatRequest(request, env, ctx) {
  const headers = corsHeaders(request, env, 'chat');

  const originError = validateApiOrigin(request, env, 'chat');
  if (originError) return json({ ok: false, message: originError }, 403, headers);

  const sizeError = validateRequestSize(request, parsePositiveInteger(env.CHAT_MAX_BODY_BYTES, DEFAULT_CHAT_MAX_BODY_BYTES));
  if (sizeError) return json({ ok: false, message: sizeError }, 413, headers);

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
    return json({ ok: true, reply: CHAT_FALLBACK_MESSAGE, links: getChatLinks(['kontakt.html#kontaktformular']), limited: true }, 200, headers);
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
    max_output_tokens: 320
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

  const rawReply = cleanAiReply(extractOpenAiText(result));
  const initialLinks = extractRecommendedLinks(rawReply);
  const reply = limitChatReply(stripRecommendedLinkSection(rawReply));
  const links = inferRecommendedLinks(messages, reply, initialLinks);

  if (!reply) {
    return json({ ok: true, reply: CHAT_FALLBACK_MESSAGE, links: getChatLinks(['kontakt.html#kontaktformular']), limited: true }, 200, headers);
  }

  const chatRecord = buildChatRecord(request, messages, reply, links);
  if (env.N8N_CHAT_WEBHOOK_URL && ctx?.waitUntil) {
    ctx.waitUntil(sendChatToN8N(chatRecord, env.N8N_CHAT_WEBHOOK_URL, env.N8N_CHAT_SECRET).catch(() => {}));
  }

  return json({ ok: true, reply, links }, 200, headers);
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

function normalizeChatLink(value) {
  const raw = clean(value, 260).replace(/[).,;:!?]+$/, '');
  if (CHAT_SITE_LINKS[raw]) return raw;

  try {
    const url = new URL(raw, 'https://deppmeyer-workflow-solutions.pages.dev');
    const href = `${url.pathname.replace(/^\//, '')}${url.hash}`;
    return CHAT_SITE_LINKS[href] ? href : '';
  } catch {
    return '';
  }
}

function getChatLinks(values) {
  const seen = new Set();
  return values
    .map(normalizeChatLink)
    .filter((href) => {
      if (!href || seen.has(href)) return false;
      seen.add(href);
      return true;
    })
    .slice(0, 3)
    .map((href) => ({ href, label: CHAT_SITE_LINKS[href] }));
}

function extractRecommendedLinks(reply) {
  const matches = String(reply || '').match(/(?:[\w-]+\.html(?:#[\w-]+)?|https?:\/\/[^\s)]+|\/[\w-]+\.html(?:#[\w-]+)?)/g) || [];
  return getChatLinks(matches);
}

function stripRecommendedLinkSection(reply) {
  let cleaned = String(reply || '').replace(/(?:\n|^)[ \t]*(?:siehe auch|passende seiten|mehr dazu|links?)\s*:\s*[\s\S]*$/i, '');

  for (const href of Object.keys(CHAT_SITE_LINKS)) {
    const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`(?:https?:\\/\\/[^\\s]+\\/)?${escaped}`, 'gi'), '');
  }

  return cleanMultiline(cleaned, 1800)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function limitChatReply(reply) {
  const cleaned = cleanMultiline(reply, 1200).trim();
  if (!cleaned) return '';

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 2);
  const compact = paragraphs.join('\n\n').trim();

  if (compact.length <= 620) return compact;

  const sentences = compact.match(/[^.!?]+[.!?]+/g) || [];
  const shortened = sentences.slice(0, 4).join(' ').trim();
  if (shortened && shortened.length <= 680) return shortened;

  return `${compact.slice(0, 600).replace(/\s+\S*$/, '')} ...`;
}

function inferRecommendedLinks(messages, reply, currentLinks = []) {
  const combinedText = `${messages.map((message) => message.content || '').join(' ')} ${reply || ''}`.toLowerCase();
  const existing = currentLinks.map((link) => typeof link === 'string' ? link : link?.href).filter(Boolean);
  const inferred = [];

  const add = (...hrefs) => {
    hrefs.forEach((href) => inferred.push(href));
  };

  if (/preis|preise|kosten|kostet|budget|angebot|pauschale|stundensatz/.test(combinedText)) {
    add('kontakt.html#kontaktformular', 'leistungen.html#leistungen-ueberblick');
  }

  if (/webseite|webseiten|website|landingpage|homepage|internetauftritt|web-app|webapp/.test(combinedText)) {
    add('leistungen.html#apps', 'beispiele.html#animierte-ablaeufe', 'kontakt.html#kontaktformular');
  }

  if (/rechnung|rechnungen|pdf|angebot|angebote|nachweis/.test(combinedText)) {
    add('leistungen.html#pdf', 'beispiele.html#beispiel-schluesseldienst-app', 'kontakt.html#kontaktformular');
  }

  if (/ocr|scan|ausweis|dokument|dokumente|foto/.test(combinedText)) {
    add('leistungen.html#ocr', 'beispiele.html#beispiel-schluesseldienst-app', 'kontakt.html#kontaktformular');
  }

  if (/app|apps|tool|interne lösung|internes system|dashboard|kundenportal/.test(combinedText)) {
    add('leistungen.html#apps', 'beispiele.html#animierte-ablaeufe', 'kontakt.html#kontaktformular');
  }

  if (/e-mail|email|postfach|workflow|automatis|formular|anfrage|benachrichtigung/.test(combinedText)) {
    add('leistungen.html#automatisierung', 'beispiele.html#animierte-ablaeufe', 'kontakt.html#kontaktformular');
  }

  if (/schnittstelle|api|import|export|datenübertragung/.test(combinedText)) {
    add('leistungen.html#schnittstellen', 'beispiele.html#animierte-ablaeufe', 'kontakt.html#kontaktformular');
  }

  if (/excel|daten|dashboard|liste|auswertung/.test(combinedText)) {
    add('leistungen.html#apps', 'leistungen.html#automatisierung', 'kontakt.html#kontaktformular');
  }

  if (!existing.length && !inferred.length) {
    add('leistungen.html#leistungen-ueberblick', 'beispiele.html#animierte-ablaeufe', 'kontakt.html#kontaktformular');
  }

  return getChatLinks([...existing, ...inferred, 'kontakt.html#kontaktformular']);
}

function buildChatRecord(request, messages, reply, links = []) {
  return {
    id: `chat:${new Date().toISOString()}:${crypto.randomUUID()}`,
    submittedAt: new Date().toISOString(),
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    userAgent: request.headers.get('User-Agent') || '',
    origin: request.headers.get('Origin') || '',
    source: 'website-chat-assistant',
    messages,
    reply,
    links
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
  const headers = corsHeaders(request, env, 'contact');

  const originError = validateApiOrigin(request, env, 'contact');
  if (originError) return json({ ok: false, message: originError }, 403, headers);

  const sizeError = validateRequestSize(request, parsePositiveInteger(env.CONTACT_MAX_BODY_BYTES, DEFAULT_CONTACT_MAX_BODY_BYTES));
  if (sizeError) return json({ ok: false, message: sizeError }, 413, headers);

  if (!env.CONTACT_FORMS) {
    return json({ ok: false, message: 'Das Kontaktformular ist noch nicht vollständig eingerichtet.' }, 500, headers);
  }

  if (!env.N8N_WEBHOOK_URL) {
    return json({ ok: false, message: 'Das Kontaktformular ist noch nicht vollständig mit dem Anfrage-Workflow verbunden.' }, 500, headers);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: 'Ungültige Anfrage.' }, 400, headers);
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
    website: clean(payload.website, 200),
    turnstileToken: clean(payload.turnstileToken, 2048)
  };

  // Honeypot: echte Nutzer sehen dieses Feld nicht.
  if (data.website) {
    return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 202, headers);
  }

  const turnstileResult = await verifyTurnstile(data.turnstileToken, request, env);
  if (!turnstileResult.ok) {
    return json({ ok: false, message: turnstileResult.message }, 400, headers);
  }

  const allowedGenderValues = ['', 'male', 'female', 'other', 'diverse'];
  if (!allowedGenderValues.includes(data.gender)) {
    return json({ ok: false, message: 'Bitte eine gültige Anrede auswählen.' }, 400, headers);
  }

  if (!data.firstName) {
    return json({ ok: false, message: 'Bitte den Vornamen angeben.' }, 400, headers);
  }

  if (!data.name) {
    return json({ ok: false, message: 'Bitte den Nachnamen angeben.' }, 400, headers);
  }

  if (!isValidEmail(data.email)) {
    return json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, 400, headers);
  }

  if (!data.topic) {
    return json({ ok: false, message: 'Bitte ein Thema auswählen.' }, 400, headers);
  }

  if (!data.message || data.message.length < 20) {
    return json({ ok: false, message: 'Bitte den Ablauf kurz mit mindestens 20 Zeichen beschreiben.' }, 400, headers);
  }

  if (data.callbackRequested && !isValidPhone(data.phone)) {
    return json({ ok: false, message: 'Bitte eine Telefonnummer für den Rückruf angeben.' }, 400, headers);
  }

  if (!data.consent) {
    return json({ ok: false, message: 'Bitte die Datenschutzhinweise bestätigen.' }, 400, headers);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const origin = request.headers.get('Origin') || '';
  const rateKey = `contact-rate:${ip}`;
  const lastSubmission = await env.CONTACT_FORMS.get(rateKey);

  if (lastSubmission && Date.now() - Number(lastSubmission) < 60000) {
    return json({ ok: false, message: 'Bitte warten Sie einen Moment, bevor Sie eine weitere Anfrage senden.' }, 429, headers);
  }

  const submittedAt = new Date().toISOString();
  const entryId = `contact:${submittedAt}:${crypto.randomUUID()}`;
  const { turnstileToken, website, ...safeData } = data;
  const record = {
    id: entryId,
    submittedAt,
    ip,
    userAgent,
    origin,
    source: 'website-contact-form',
    ...safeData
  };

  await Promise.all([
    env.CONTACT_FORMS.put(entryId, JSON.stringify(record), { expirationTtl: getContactTtl(env) }),
    env.CONTACT_FORMS.put(rateKey, String(Date.now()), { expirationTtl: 120 })
  ]);

  try {
    await sendToN8N(record, env.N8N_WEBHOOK_URL, env.N8N_CONTACT_SECRET);
  } catch {
    return json(
      {
        ok: false,
        message: 'Anfrage wurde gespeichert, aber die Weiterleitung an den Workflow hat nicht funktioniert.'
      },
      502,
      headers
    );
  }

  return json({ ok: true, message: 'Anfrage erfolgreich abgesendet.' }, 200, headers);
}

async function sendToN8N(record, webhookUrl, secret) {
  if (!webhookUrl) {
    throw new Error('n8n webhook missing');
  }

  let url;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new Error('n8n webhook invalid');
  }

  if (url.protocol !== 'https:') {
    throw new Error('n8n webhook must use https');
  }

  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (secret) {
    headers['X-Contact-Secret'] = secret;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`n8n error ${response.status}: ${text}`);
  }
}

function handleOptions(request, env, type = 'chat') {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env, type)
  });
}

function corsHeaders(request, env, type = 'chat') {
  const origin = request.headers.get('Origin') || '';
  const requestHost = new URL(request.url).origin;
  const allowedOrigins = getAllowedOrigins(request, env, type);
  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : requestHost;

  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, CF-Turnstile-Response',
    'Vary': 'Origin'
  };
}

function getAllowedOrigins(request, env, type = 'chat') {
  const requestHost = new URL(request.url).origin;
  const configured = type === 'contact'
    ? (env.CONTACT_ALLOWED_ORIGIN || env.ALLOWED_ORIGIN || '')
    : (env.CHAT_ALLOWED_ORIGIN || env.ALLOWED_ORIGIN || '');

  const origins = String(configured || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (!origins.includes(requestHost)) origins.push(requestHost);
  return origins;
}

function validateApiOrigin(request, env, type = 'chat') {
  const origin = request.headers.get('Origin') || '';
  if (!origin) return '';
  const normalizedOrigin = origin.replace(/\/$/, '');
  const allowedOrigins = getAllowedOrigins(request, env, type);
  return allowedOrigins.includes(normalizedOrigin) ? '' : 'Diese Anfrage kommt nicht von einer erlaubten Webseite.';
}

function validateRequestSize(request, maxBytes) {
  const rawLength = request.headers.get('Content-Length');
  if (!rawLength) return '';
  const length = Number(rawLength);
  if (!Number.isFinite(length)) return '';
  return length > maxBytes ? 'Die Anfrage ist zu groß. Bitte kürze den Text.' : '';
}

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: true };

  if (!token) {
    return { ok: false, message: 'Bitte bestätige den Formularschutz und sende die Anfrage erneut.' };
  }

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (ip) formData.append('remoteip', ip);

  let verificationResponse;
  try {
    verificationResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData
    });
  } catch {
    return { ok: false, message: 'Der Formularschutz konnte gerade nicht geprüft werden. Bitte versuche es erneut.' };
  }

  if (!verificationResponse.ok) {
    return { ok: false, message: 'Der Formularschutz konnte gerade nicht geprüft werden. Bitte versuche es erneut.' };
  }

  const result = await verificationResponse.json().catch(() => null);
  return result?.success
    ? { ok: true }
    : { ok: false, message: 'Der Formularschutz wurde nicht bestätigt. Bitte versuche es erneut.' };
}

function clean

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
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}
