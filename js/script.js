(() => {
  const body = document.body;
  const topbar = document.querySelector('.topbar');
  const progress = document.querySelector('.scroll-progress');
  const cursorGlow = document.querySelector('.cursor-glow');
  const themeButtons = [...document.querySelectorAll('[data-theme-toggle]')];

  const THEME_KEY = 'deppmeyer-theme';
  const applyTheme = (theme, persist = true) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    body.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    if (persist) {
      try { window.sessionStorage.setItem(THEME_KEY, nextTheme); } catch (error) {}
    }
    themeButtons.forEach((button) => {
      const icon = button.querySelector('.theme-toggle-icon');
      const text = button.querySelector('.theme-toggle-text');
      const darkActive = nextTheme === 'dark';
      if (icon) icon.textContent = darkActive ? '☾' : '☀';
      if (text) text.textContent = darkActive ? 'Dunkel' : 'Hell';
      button.setAttribute('aria-pressed', String(darkActive));
      button.setAttribute('title', darkActive ? 'Dunkelmodus aktiv, zu Hellmodus wechseln' : 'Hellmodus aktiv, zu Dunkelmodus wechseln');
    });
  };

  let storedTheme = '';
  try { storedTheme = window.sessionStorage.getItem(THEME_KEY) || ''; } catch (error) {}
  applyTheme(storedTheme || body.getAttribute('data-theme') || 'light', false);
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    applyTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }));

  const setHeaderOffset = () => {
    if (!topbar) return;
    const next = Math.ceil(topbar.offsetHeight + 8);
    document.documentElement.style.setProperty('--topbar-offset', `${next}px`);
  };
  setHeaderOffset();
  window.addEventListener('resize', setHeaderOffset);

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${Math.min(1, percent) * 100}%`;
    if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 12);
    setHeaderOffset();
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (cursorGlow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('pointermove', (event) => {
      cursorGlow.style.transform = `translate(${event.clientX - cursorGlow.offsetWidth / 2}px, ${event.clientY - cursorGlow.offsetHeight / 2}px)`;
    }, { passive: true });
  }

  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  if (mobileToggle && mobilePanel) {
    const closeMobilePanel = () => {
      mobilePanel.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(setHeaderOffset);
    };
    mobileToggle.addEventListener('click', () => {
      const open = mobilePanel.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(open));
      requestAnimationFrame(setHeaderOffset);
    });
    mobilePanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobilePanel));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) closeMobilePanel();
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((node) => revealObserver.observe(node));

  document.querySelectorAll('.faq-item').forEach((item) => {
    const button = item.querySelector('.faq-question');
    if (!button) return;
    button.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      const sign = button.querySelector('span');
      if (sign) sign.textContent = open ? '–' : '+';
    });
  });

  const initFaqExplorer = () => {
    const explorer = document.querySelector('[data-faq-explorer]');
    const toggle = document.querySelector('[data-faq-expand]');
    if (!explorer || !toggle) return;
    const chips = [...explorer.querySelectorAll('[data-faq-topic]')];
    const items = [...explorer.querySelectorAll('[data-faq-topic-item]')];
    const input = explorer.querySelector('[data-faq-search]');
    let activeTopic = chips[0]?.getAttribute('data-faq-topic') || '';

    const apply = () => {
      const query = (input?.value || '').trim().toLowerCase();
      let visibleCount = 0;
      items.forEach((item) => {
        const topic = item.getAttribute('data-faq-topic-item') || '';
        const text = item.getAttribute('data-faq-search-text') || item.textContent.toLowerCase();
        const topicMatch = !activeTopic || activeTopic === 'all' || topic === activeTopic;
        const queryMatch = !query || text.includes(query);
        const visible = topicMatch && queryMatch;
        item.classList.toggle('is-hidden', !visible);
        if (visible) visibleCount += 1;
      });
      explorer.setAttribute('data-visible-count', String(visibleCount));
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      activeTopic = chip.getAttribute('data-faq-topic') || '';
      chips.forEach((entry) => {
        const isActive = entry === chip;
        entry.classList.toggle('is-active', isActive);
        entry.setAttribute('aria-selected', String(isActive));
      });
      apply();
    }));

    input?.addEventListener('input', apply);
    toggle.addEventListener('click', () => {
      const willOpen = explorer.hasAttribute('hidden');
      if (willOpen) {
        explorer.removeAttribute('hidden');
        toggle.textContent = 'Weniger Fragen';
        requestAnimationFrame(() => {
          explorer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        explorer.setAttribute('hidden', '');
        toggle.textContent = 'Weitere Fragen';
      }
    });
    apply();
  };
  initFaqExplorer();

  document.querySelectorAll('.accordion-card,.faq-more,.example-meta-toggle').forEach((details) => {
    const summary = details.querySelector(':scope > summary');
    const action = details.querySelector(':scope > summary .accordion-action');
    const setAction = () => {
      if (!action) return;
      if (details.classList.contains('faq-more')) action.textContent = details.open ? 'Schließen' : 'Öffnen';
      else action.textContent = details.open ? 'Weniger' : 'Details';
    };
    setAction();
    details.addEventListener('toggle', () => {
      setAction();
      const parent = details.parentElement;
      if (details.open && parent && parent.classList.contains('accordion-grid')) {
        parent.querySelectorAll(':scope > details[open]').forEach((other) => {
          if (other !== details) other.open = false;
        });
      }
    });
    if (summary) {
      summary.addEventListener('click', () => {
        details.style.setProperty('--mx', '50%');
        details.style.setProperty('--my', '50%');
      });
    }
  });

  const compareButtons = document.querySelectorAll('[data-compare-btn]');
  compareButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-compare-btn');
      compareButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      document.querySelectorAll('[data-compare-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.getAttribute('data-compare-panel') !== value));
    });
  });

  const initExamplesFilter = () => {
    const input = document.querySelector('[data-example-filter]');
    const chips = [...document.querySelectorAll('[data-example-chip]')];
    const cards = [...document.querySelectorAll('[data-example-card]')];
    if (!cards.length) return;
    let activeChip = 'all';
    const applyFilter = () => {
      const query = input ? (input.value || '').trim().toLowerCase() : '';
      cards.forEach((card) => {
        const text = `${card.getAttribute('data-example-filter-text') || ''} ${card.textContent || ''}`.toLowerCase();
        const category = (card.getAttribute('data-example-category') || '').toLowerCase();
        const chipMatches = activeChip === 'all' || category === activeChip || text.includes(activeChip);
        const queryMatches = !query || text.includes(query);
        card.classList.toggle('is-filter-hidden', !(chipMatches && queryMatches));
      });
    };
    if (input) input.addEventListener('input', applyFilter);
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeChip = chip.getAttribute('data-example-chip') || 'all';
        chips.forEach((item) => item.classList.toggle('is-active', item === chip));
        applyFilter();
      });
    });
    applyFilter();
  };
  initExamplesFilter();

  const workflows = {
    hero: {
      steps: [
        { title: 'Eingang erkannt', description: 'Neue Anfrage wird aus Postfach oder Formular übernommen.' },
        { title: 'Anfrage wird geprüft', description: 'Inhalt, Thema und Vollständigkeit werden kontrolliert.' },
        { title: 'Inhalt wird kategorisiert', description: 'Thema und Priorität werden sauber eingeordnet.' },
        { title: 'Zuständigkeit wird ermittelt', description: 'Die passende Person oder der passende Ablauf wird gewählt.' },
        { title: 'Weiterleitung vorbereitet', description: 'Alle relevanten Informationen werden gebündelt übergeben.' },
        { title: 'Prozess abgeschlossen', description: 'Dokumentation und Status sind direkt sichtbar.' }
      ]
    },
    email: {
      steps: [
        { title: 'E-Mail erkannt', description: 'Die neue Nachricht wird automatisch übernommen.' },
        { title: 'Inhalt geprüft', description: 'Betreff, Absender und Inhalt werden ausgewertet.' },
        { title: 'Kategorie gesetzt', description: 'Das Anliegen wird thematisch eingeordnet.' },
        { title: 'Priorität vergeben', description: 'Dringlichkeit und Bearbeitungsweg werden bestimmt.' },
        { title: 'Antwort vorbereitet', description: 'Eine passende Erstreaktion oder Zuweisung wird vorbereitet.' },
        { title: 'Status dokumentiert', description: 'Der Fall ist sauber nachvollziehbar festgehalten.' }
      ]
    },
    form: {
      steps: [
        { title: 'Formular empfangen', description: 'Die Anfrage wird direkt strukturiert übernommen.' },
        { title: 'Pflichtdaten geprüft', description: 'Fehlende oder unklare Angaben werden erkannt.' },
        { title: 'Informationen aufbereitet', description: 'Die Daten werden für die Bearbeitung sauber geordnet.' },
        { title: 'Rückmeldung vorbereitet', description: 'Eine passende erste Antwort wird erzeugt.' },
        { title: 'Kontakt dokumentiert', description: 'Der Kontakt wird im richtigen System hinterlegt.' },
        { title: 'Übergabe abgeschlossen', description: 'Zuständige Personen haben direkt alle Infos.' }
      ]
    },
    term: {
      steps: [
        { title: 'Terminwunsch erfasst', description: 'Die Anfrage wird direkt übernommen.' },
        { title: 'Verfügbarkeit geprüft', description: 'Freie Zeiten werden automatisiert mit dem Kalender abgeglichen.' },
        { title: 'Termin gebucht', description: 'Ein passender Zeitpunkt wird bestätigt oder vorgeschlagen.' },
        { title: 'Bestätigung versendet', description: 'Die Terminbestätigung geht automatisch raus.' },
        { title: 'Erinnerung geplant', description: 'Vor dem Termin wird automatisch erinnert.' },
        { title: 'Ablage aktualisiert', description: 'Der Vorgang bleibt sauber dokumentiert.' }
      ]
    },
    docs: {
      steps: [
        { title: 'Datei eingegangen', description: 'Dokument oder Rechnung wird übernommen.' },
        { title: 'Inhalt erkannt', description: 'Relevante Inhalte werden gelesen und geprüft.' },
        { title: 'Dokument benannt', description: 'Eine einheitliche Benennung wird vergeben.' },
        { title: 'Ordner gewählt', description: 'Der passende Ablageort wird bestimmt.' },
        { title: 'Datei abgelegt', description: 'Die Datei landet automatisch am richtigen Ort.' },
        { title: 'Status bestätigt', description: 'Ablage und Bearbeitung sind nachvollziehbar.' }
      ]
    },
    support: {
      steps: [
        { title: 'Anfrage empfangen', description: 'Eine Serviceanfrage wird direkt erfasst.' },
        { title: 'Dringlichkeit erkannt', description: 'Wichtige Fälle werden priorisiert.' },
        { title: 'Zuständigkeit zugeordnet', description: 'Die richtige Person wird automatisch gewählt.' },
        { title: 'Status gesetzt', description: 'Der Bearbeitungsstand wird sichtbar festgelegt.' },
        { title: 'Weitergabe erfolgt', description: 'Alle nötigen Infos gehen gebündelt weiter.' },
        { title: 'Bearbeitung vorbereitet', description: 'Der Fall kann ohne Rückfragen starten.' }
      ]
    },
    internal: {
      steps: [
        { title: 'Interne Anfrage startet', description: 'Ein interner Vorgang wird ausgelöst.' },
        { title: 'Inhalt geprüft', description: 'Das Anliegen wird kurz bewertet.' },
        { title: 'Richtige Stelle gewählt', description: 'Die passende Zuständigkeit wird ermittelt.' },
        { title: 'Weiterleitung erstellt', description: 'Alle relevanten Informationen werden gesammelt.' },
        { title: 'Rückmeldung vorbereitet', description: 'Der Status wird transparent zurückgespielt.' },
        { title: 'Vorgang dokumentiert', description: 'Der Ablauf bleibt später nachvollziehbar.' }
      ]
    },
    response: {
      steps: [
        { title: 'Anfrage eingelesen', description: 'Der Inhalt wird automatisiert übernommen.' },
        { title: 'Angaben extrahiert', description: 'Relevante Daten werden strukturiert übernommen.' },
        { title: 'Entwurf vorbereitet', description: 'Antwort oder Angebotsgrundlage wird erstellt.' },
        { title: 'Freigabeweg festgelegt', description: 'Bei Bedarf wird eine Prüfung eingebaut.' },
        { title: 'Vorlage bereit', description: 'Der Vorgang ist für Prüfung oder Versand vorbereitet.' },
        { title: 'Nachvollziehbarkeit gesichert', description: 'Alle Schritte sind dokumentiert.' }
      ]
    },
    multichannel: {
      steps: [
        { title: 'Quellen gesammelt', description: 'E-Mail, Formular und weitere Kanäle laufen zusammen.' },
        { title: 'Daten vereinheitlicht', description: 'Unterschiedliche Formate werden angeglichen.' },
        { title: 'Thema erkannt', description: 'Anliegen werden sauber kategorisiert.' },
        { title: 'Dokumentation erstellt', description: 'Der Vorgang wird einheitlich festgehalten.' },
        { title: 'Zuweisung ausgelöst', description: 'Die richtige Stelle übernimmt automatisch.' },
        { title: 'Status abgeschlossen', description: 'Alle Beteiligten sehen den aktuellen Stand.' }
      ]
    }
  };

  const initWorkflow = (root) => {
    const workflowId = root.getAttribute('data-workflow');
    const config = workflows[workflowId];
    if (!config) return;

    const currentBox = root.querySelector('.workflow-current');
    let nodes = [...root.querySelectorAll('[data-step]')];
    if (nodes.length < config.steps.length) {
      const stepsToAdd = config.steps.length - nodes.length;
      for (let i = 0; i < stepsToAdd; i += 1) {
        const step = config.steps[nodes.length + i];
        const node = document.createElement('div');
        node.className = 'workflow-node';
        node.setAttribute('data-step', '');
        node.innerHTML = `<div><strong>${step.title}</strong><p>${step.description}</p></div><span class="node-status">Schritt aktiv</span>${nodes.length + i < config.steps.length - 1 ? '<span class="workflow-link"></span>' : ''}`;
        if (currentBox) root.insertBefore(node, currentBox);
        else root.appendChild(node);
      }
      nodes = [...root.querySelectorAll('[data-step]')];
    }

    let statusText = root.querySelector('[data-workflow-status]');
    if (!statusText) {
      const firstPill = root.querySelector('.workflow-current .status-pill');
      if (firstPill) {
        firstPill.textContent = 'Status: ';
        statusText = document.createElement('span');
        statusText.setAttribute('data-workflow-status', '');
        statusText.textContent = 'Bereit';
        firstPill.appendChild(statusText);
      }
    }
    const descriptionText = root.querySelector('[data-workflow-description]');
    const currentTitle = root.querySelector('[data-workflow-current-title]');
    const progressText = root.querySelector('[data-workflow-progress]');
    const trigger = root.querySelector('[data-workflow-trigger]');
    let index = -1;
    let timer = null;

    if (currentBox) {
      let currentCopy = currentBox.querySelector('.workflow-current-copy');
      if (!currentCopy) {
        currentCopy = document.createElement('div');
        currentCopy.className = 'workflow-current-copy';
        const left = document.createElement('div');
        const right = document.createElement('div');
        right.className = 'workflow-current-side';
        if (currentTitle) left.appendChild(currentTitle);
        if (descriptionText) left.appendChild(descriptionText);
        const pills = currentBox.querySelector('.contact-response');
        if (pills) {
          [...pills.children].forEach((child) => right.appendChild(child));
          pills.remove();
        }
        currentCopy.appendChild(left);
        currentCopy.appendChild(right);
        currentBox.appendChild(currentCopy);
      }
    }

    if (root.classList.contains('example-dashboard') && trigger) {
      let toolbar = root.querySelector('.workflow-toolbar');
      if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.class
