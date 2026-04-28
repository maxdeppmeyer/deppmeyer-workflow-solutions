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
    const nearTop = window.scrollY < 42;
    body.classList.toggle('page-at-top', nearTop);
    body.classList.toggle('page-has-scrolled', !nearTop);
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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileViewport = () => window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches;
  const getHeaderOffset = () => {
    const stored = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-offset'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return topbar ? Math.ceil(topbar.offsetHeight + 8) : 92;
  };

  const scrollTargetIntoView = (target, options = {}) => {
    if (!target) return;
    const {
      block = 'center',
      force = false,
      padding = isMobileViewport() ? 28 : 44,
      extraOffset = 0,
      delay = 0,
      instant = false
    } = options;

    const run = () => {
      const rect = target.getBoundingClientRect();
      const headerOffset = getHeaderOffset() + extraOffset;
      const viewTop = headerOffset + padding;
      const viewBottom = window.innerHeight - padding;
      const targetTop = rect.top;
      const targetBottom = rect.bottom;
      const targetCenter = rect.top + (rect.height / 2);
      const comfortablyVisible = targetTop >= viewTop && targetBottom <= viewBottom;

      if (!force) {
        if (block === 'center') {
          const centerSlack = Math.max(isMobileViewport() ? 120 : 160, rect.height * 0.2);
          const viewportCenter = viewTop + ((viewBottom - viewTop) / 2);
          if (comfortablyVisible && Math.abs(targetCenter - viewportCenter) <= centerSlack) return;
        } else if (comfortablyVisible) {
          return;
        }
      }

      let top = window.scrollY;
      if (block === 'start') {
        top = Math.max(window.scrollY + targetTop - headerOffset, 0);
      } else if (block === 'nearest') {
        if (targetTop < viewTop) top = Math.max(window.scrollY + targetTop - headerOffset, 0);
        else if (targetBottom > viewBottom) top = Math.max(window.scrollY + targetBottom - window.innerHeight + padding, 0);
        else return;
      } else {
        const visibleHeight = Math.max(window.innerHeight - viewTop - padding, 220);
        top = Math.max(window.scrollY + targetCenter - headerOffset - (visibleHeight / 2), 0);
      }

      window.scrollTo({ top, behavior: instant || prefersReducedMotion || window.matchMedia('(max-width: 760px)').matches ? 'auto' : 'smooth' });
    };

    if (delay > 0) window.setTimeout(run, delay);
    else window.requestAnimationFrame(run);
  };

  document.querySelectorAll('.faq-item').forEach((item) => {
    const button = item.querySelector('.faq-question');
    if (!button) return;
    button.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      const sign = button.querySelector('span');
      if (sign) sign.textContent = open ? '–' : '+';
      if (open) scrollTargetIntoView(item, { block: 'center', padding: isMobileViewport() ? 22 : 32, delay: 18 });
    });
  });



  const initFaqExplorer = () => {
    const explorer = document.querySelector('[data-faq-explorer]');
    const toggle = document.querySelector('[data-faq-expand]');
    if (!explorer || !toggle) return;
    const chips = [...explorer.querySelectorAll('[data-faq-topic]')];
    const items = [...explorer.querySelectorAll('[data-faq-topic-item]')];
    const input = explorer.querySelector('[data-faq-search]');
    const topicBar = explorer.querySelector('.faq-topic-bar');
    const topicGrid = explorer.querySelector('[data-faq-topic-grid]');
    const explorerHead = explorer.querySelector('.faq-explorer-head');
    let activeTopic = chips[0]?.getAttribute('data-faq-topic') || '';

    const normalizeSearch = (value) => String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const levenshtein = (a, b) => {
      const aa = normalizeSearch(a);
      const bb = normalizeSearch(b);
      if (!aa) return bb.length;
      if (!bb) return aa.length;
      const dp = Array.from({ length: aa.length + 1 }, (_, i) => [i]);
      for (let j = 1; j <= bb.length; j += 1) dp[0][j] = j;
      for (let i = 1; i <= aa.length; i += 1) {
        for (let j = 1; j <= bb.length; j += 1) {
          const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
      }
      return dp[aa.length][bb.length];
    };

    const synonymGroups = {
      email: ['email','e mail','mail','postfach','postfaecher','posteingang','inbox','kundenantwort','autoantwort','erstantwort'],
      termine: ['termin','termine','kalender','buchung','terminbuchung','erinnerung','rueckruf'],
      dokumente: ['dokument','dokumente','datei','dateien','angebot','angebote','rechnung','ablage','anhang'],
      technik: ['technik','tools','tool','integration','integrationen','schnittstelle','schnittstellen'],
      kosten: ['kosten','nutzen','preis','preise','wirtschaftlich','wirtschaftlichkeit'],
      workflow: ['workflow','automatisierung','prozess','prozesse','ablauf','ablaeufe']
    };

    const topicLabelMap = chips.reduce((map, chip) => {
      const key = chip.getAttribute('data-faq-topic') || '';
      if (key) map[key] = chip.textContent.trim();
      return map;
    }, {});

    let resultsPanel = explorer.querySelector('[data-faq-search-results]');
    if (!resultsPanel && topicGrid) {
      resultsPanel = document.createElement('div');
      resultsPanel.className = 'faq-search-results search-results hidden';
      resultsPanel.setAttribute('data-faq-search-results', '');
      topicGrid.parentNode.insertBefore(resultsPanel, topicGrid);
    }

    const buildKeywords = (entry) => {
      const raw = `${entry.question || ''} ${entry.answer || ''} ${entry.topicLabel || ''} ${entry.searchText || ''}`;
      const normalized = normalizeSearch(raw);
      const tokens = [...new Set(normalized.split(/\s+/).filter(Boolean))];
      Object.values(synonymGroups).forEach((group) => {
        if (group.some((term) => normalized.includes(normalizeSearch(term)))) tokens.push(...group.map(normalizeSearch));
      });
      return [...new Set(tokens)].filter(Boolean);
    };

    const faqIndex = items.map((item, index) => {
      const topic = item.getAttribute('data-faq-topic-item') || '';
      const questionButton = item.querySelector('.faq-question');
      const questionText = questionButton ? questionButton.childNodes[0]?.textContent?.trim() || questionButton.textContent.replace(/[+–-]\s*$/, '').trim() : '';
      const answerText = item.querySelector('.faq-answer-inner')?.textContent?.trim() || '';
      const searchText = item.getAttribute('data-faq-search-text') || `${questionText} ${answerText}`;
      const entry = {
        index,
        item,
        topic,
        topicLabel: topicLabelMap[topic] || 'FAQ',
        question: questionText,
        answer: answerText,
        searchText,
      };
      return {
        ...entry,
        normalized: normalizeSearch(`${entry.question} ${entry.answer} ${entry.searchText} ${entry.topicLabel}`),
        keywordsList: buildKeywords(entry)
      };
    });

    const setActiveTopic = (topic) => {
      activeTopic = topic || chips[0]?.getAttribute('data-faq-topic') || '';
      chips.forEach((entry) => {
        const isActive = (entry.getAttribute('data-faq-topic') || '') === activeTopic;
        entry.classList.toggle('is-active', isActive);
        entry.setAttribute('aria-selected', String(isActive));
      });
    };

    const closeSearchResults = () => {
      resultsPanel?.classList.add('hidden');
      if (resultsPanel) resultsPanel.innerHTML = '';
      explorer.classList.remove('faq-search-mode');
      if (topicGrid) topicGrid.hidden = false;
    };

    const apply = () => {
      let visibleCount = 0;
      const maxVisible = 8;
      items.forEach((item) => {
        const topic = item.getAttribute('data-faq-topic-item') || '';
        const isDefault = item.getAttribute('data-faq-default') === 'true';
        const topicMatch = !activeTopic || (activeTopic === 'all' ? isDefault : topic === activeTopic);
        const visible = topicMatch && visibleCount < maxVisible;
        item.classList.toggle('is-hidden', !visible);
        if (visible) visibleCount += 1;
      });
      explorer.setAttribute('data-visible-count', String(visibleCount));
      return items.find((item) => !item.classList.contains('is-hidden')) || null;
    };

    const renderSearchResults = (queryRaw) => {
      if (!resultsPanel) return false;
      const query = normalizeSearch(queryRaw);
      if (!query) {
        closeSearchResults();
        apply();
        return false;
      }

      const directMatches = faqIndex
        .map((entry) => ({ entry, score: entry.normalized.includes(query) ? 100 : 0 }))
        .filter((entry) => entry.score > 0)
        .slice(0, 8);

      let matches = directMatches;
      if (!matches.length) {
        matches = faqIndex.map((entry) => {
          let score = 0;
          entry.keywordsList.forEach((token) => {
            if (token === query) score = Math.max(score, 95);
            else if (token.startsWith(query) || query.startsWith(token)) score = Math.max(score, 80);
            else if (token.includes(query) || query.includes(token)) score = Math.max(score, 74);
            else {
              const dist = levenshtein(query, token);
              if (dist <= 1) score = Math.max(score, 70);
              else if (dist === 2 && query.length > 4) score = Math.max(score, 62);
            }
          });
          Object.entries(synonymGroups).forEach(([key, group]) => {
            const matchesGroup = group.some((term) => {
              const normalizedTerm = normalizeSearch(term);
              const dist = levenshtein(query, normalizedTerm);
              return normalizedTerm.includes(query) || query.includes(normalizedTerm) || dist <= (query.length > 5 ? 2 : 1);
            });
            if (matchesGroup && entry.keywordsList.includes(normalizeSearch(key))) score = Math.max(score, 68);
          });
          return { entry, score };
        }).filter((entry) => entry.score >= 60).sort((a, b) => b.score - a.score).slice(0, 6);
      }

      resultsPanel.classList.remove('hidden');
      explorer.classList.add('faq-search-mode');
      if (topicGrid) topicGrid.hidden = true;

      if (!matches.length) {
        resultsPanel.innerHTML = '<div class="search-result"><h3>Keine direkten Treffer</h3><p>Zu diesem Begriff wurden keine passenden FAQ gefunden. Versuche Begriffe wie E-Mail, Termine, Dokumente, Angebote oder Technik.</p></div>';
        return true;
      }

      const note = directMatches.length ? '' : `
        <div class="search-result suggestion-note">
          <h3>Keine direkten Treffer</h3>
          <p>Zu „${queryRaw.replace(/</g, '&lt;')}“ wurden keine exakten FAQ gefunden. Vielleicht ist eine dieser Fragen gemeint:</p>
        </div>
      `;

      resultsPanel.innerHTML = `${note}${matches.map(({ entry }) => `
        <button class="search-result faq-search-result" data-faq-result-index="${entry.index}" type="button">
          <h3>${entry.question}</h3>
          <p>${entry.answer}</p>
          <small>${entry.topicLabel}</small>
        </button>
      `).join('')}`;
      return true;
    };

    const openFaqItem = (item) => {
      if (!item) return;
      const button = item.querySelector('.faq-question');
      if (!button) return;
      if (!item.classList.contains('open')) {
        item.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        const sign = button.querySelector('span');
        if (sign) sign.textContent = '–';
      }
      scrollTargetIntoView(item, {
        block: 'start',
        padding: isMobileViewport() ? 20 : 28,
        delay: 14
      });
    };

    const centerTopicPicker = () => {
      scrollTargetIntoView(topicBar || explorerHead || explorer, {
        block: 'center',
        force: true,
        padding: isMobileViewport() ? 18 : 30,
        delay: 18
      });
    };

    const centerVisibleFaqs = () => {
      const firstVisible = apply();
      if (firstVisible) {
        scrollTargetIntoView(firstVisible, {
          block: 'center',
          force: true,
          padding: isMobileViewport() ? 18 : 30,
          delay: 18
        });
      } else if (topicGrid) {
        scrollTargetIntoView(topicGrid, {
          block: 'center',
          force: true,
          padding: isMobileViewport() ? 18 : 30,
          delay: 18
        });
      }
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      setActiveTopic(chip.getAttribute('data-faq-topic') || '');
      if ((input?.value || '').trim()) {
        renderSearchResults(input.value);
      } else {
        centerVisibleFaqs();
      }
    }));

    input?.addEventListener('input', () => {
      const hasQuery = renderSearchResults(input.value);
      if (!hasQuery) apply();
    });

    resultsPanel?.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-faq-result-index]');
      if (!trigger) return;
      const entry = faqIndex[Number(trigger.getAttribute('data-faq-result-index'))];
      if (!entry) return;
      if (input) input.value = '';
      closeSearchResults();
      setActiveTopic(entry.topic || 'all');
      apply();
      openFaqItem(entry.item);
    });

    toggle.addEventListener('click', () => {
      const willOpen = explorer.hasAttribute('hidden');
      if (willOpen) {
        explorer.removeAttribute('hidden');
        toggle.textContent = 'Weniger Fragen';
        if ((input?.value || '').trim()) renderSearchResults(input.value);
        else apply();
        centerTopicPicker();
      } else {
        explorer.setAttribute('hidden', '');
        toggle.textContent = 'Weitere Fragen';
        closeSearchResults();
      }
    });

    setActiveTopic(activeTopic);
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
      if (details.open) {
        const target = details.classList.contains('example-meta-toggle')
          ? (details.querySelector('.accordion-content') || details)
          : details;
        scrollTargetIntoView(target, {
          block: details.classList.contains('example-meta-toggle') ? 'start' : 'center',
          padding: isMobileViewport() ? 20 : 34,
          delay: 18
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
    },
    locksmith: {
      steps: [
        { title: 'Auftrag wird geöffnet', description: 'Der Mitarbeiter startet den neuen Einsatz direkt vor Ort.' },
        { title: 'Ausweis wird gescannt', description: 'OCR erkennt relevante Kundendaten und bereitet sie zur Prüfung vor.' },
        { title: 'Daten werden bestätigt', description: 'Der Mitarbeiter kontrolliert die erkannten Angaben und ergänzt fehlende Informationen.' },
        { title: 'Leistungen werden gewählt', description: 'Fahrt, Einsatzart, Material und Hinweise werden mit wenigen Klicks erfasst.' },
        { title: 'Rechnung wird erzeugt', description: 'Aus den geprüften Daten entsteht automatisch ein sauberes PDF.' },
        { title: 'Vorgang ist abgeschlossen', description: 'Rechnung und Einsatzdaten sind gespeichert und können später nachvollzogen werden.' }
      ]
    },
    offer: {
      steps: [
        { title: 'Anfrage kommt rein', description: 'Formular, E-Mail oder Anhang werden als neuer Vorgang erkannt.' },
        { title: 'Kundendaten werden sortiert', description: 'Kontaktdaten, Leistungswunsch und Unterlagen werden strukturiert.' },
        { title: 'Fehlende Angaben fallen auf', description: 'Unklare Punkte werden markiert, bevor Zeit in ein falsches Angebot fließt.' },
        { title: 'Angebotsgrundlage entsteht', description: 'Die wichtigsten Informationen werden für die Angebotserstellung vorbereitet.' },
        { title: 'Prüfung wird möglich', description: 'Eine Person kann den Vorschlag prüfen, ergänzen oder freigeben.' },
        { title: 'Angebot ist vorbereitet', description: 'Der Vorgang ist sauber dokumentiert und bereit für den nächsten Schritt.' }
      ]
    },
    inbox: {
      steps: [
        { title: 'Neue E-Mail erkannt', description: 'Eine Kundenanfrage wird automatisch aus dem Postfach übernommen.' },
        { title: 'Inhalt wird gelesen', description: 'Betreff, Absender, Thema und mögliche Dringlichkeit werden ausgewertet.' },
        { title: 'Kategorie wird gesetzt', description: 'Die Anfrage wird zum passenden Bereich oder Bearbeitungsweg sortiert.' },
        { title: 'Antwort wird vorbereitet', description: 'Eine passende Erstreaktion oder interne Notiz wird erzeugt.' },
        { title: 'Zuständigkeit wird gesetzt', description: 'Die richtige Person oder der richtige Workflow übernimmt den Vorgang.' },
        { title: 'Status bleibt sichtbar', description: 'Bearbeitung und nächste Schritte sind nachvollziehbar statt nur im Postfach versteckt.' }
      ]
    },
    documents: {
      steps: [
        { title: 'Datei wird hochgeladen', description: 'Rechnung, Nachweis, Formular oder Anhang kommen in den digitalen Eingang.' },
        { title: 'Dokumenttyp wird erkannt', description: 'Der Ablauf erkennt, ob es sich um Rechnung, Nachweis oder Kundenunterlage handelt.' },
        { title: 'Name wird erzeugt', description: 'Die Datei bekommt eine einheitliche Bezeichnung mit Datum, Kunde oder Vorgang.' },
        { title: 'Ablageort wird gewählt', description: 'Das Dokument wird automatisch dem richtigen Ordner oder Vorgang zugeordnet.' },
        { title: 'Information wird weitergegeben', description: 'Bei Bedarf wird eine Benachrichtigung oder Freigabe ausgelöst.' },
        { title: 'Dokument ist auffindbar', description: 'Die Ablage ist sauber, einheitlich und später besser nachvollziehbar.' }
      ]
    },
    statusflow: {
      steps: [
        { title: 'Auftrag wird erfasst', description: 'Ein neuer Vorgang entsteht aus Anfrage, Formular oder interner Eingabe.' },
        { title: 'Zuständigkeit wird gesetzt', description: 'Der passende Mitarbeiter oder Bereich wird automatisch vorgeschlagen.' },
        { title: 'Status wird aktualisiert', description: 'Der aktuelle Bearbeitungsstand wird sichtbar statt per Zuruf geklärt.' },
        { title: 'Rückfrage wird vorbereitet', description: 'Fehlende Informationen werden gesammelt und gezielt angefragt.' },
        { title: 'Übergabe wird dokumentiert', description: 'Alle relevanten Angaben bleiben am Vorgang und gehen nicht in Chats verloren.' },
        { title: 'Abschluss wird gemeldet', description: 'Kunde oder Team erhalten die passende Rückmeldung zum Ergebnis.' }
      ]
    }
  };

  let activeWorkflowController = null;

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
        toolbar.className = 'workflow-toolbar';
        const buttonRow = document.createElement('div');
        buttonRow.className = 'btn-row';
        trigger.parentElement?.remove();
        buttonRow.appendChild(trigger);
        toolbar.appendChild(buttonRow);
        root.insertBefore(toolbar, root.firstChild);
      }
    }

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const applyStepState = (stepIndex) => {
      const visibleNodeLimit = Math.min(stepIndex, nodes.length - 1);
      nodes.forEach((node, nodeIndex) => {
        const shouldShow = stepIndex >= 0 && nodeIndex <= visibleNodeLimit;
        node.classList.toggle('is-hidden', !shouldShow);
        node.classList.toggle('active', stepIndex >= 0 && nodeIndex === visibleNodeLimit && stepIndex < nodes.length);
        node.classList.toggle('done', stepIndex >= 0 && nodeIndex < visibleNodeLimit);
      });
      root.classList.toggle('workflow-running', stepIndex >= 0 && stepIndex < config.steps.length - 1);
      root.classList.toggle('workflow-complete', stepIndex >= config.steps.length - 1 && stepIndex >= 0);
    };

    const reset = () => {
      clearTimer();
      index = -1;
      applyStepState(index);
      if (statusText) statusText.textContent = 'Bereit';
      if (currentTitle) currentTitle.textContent = 'Bereit zum Start';
      if (descriptionText) descriptionText.textContent = 'Starte den Workflow, um den Ablauf Schritt für Schritt zu sehen.';
      if (progressText) progressText.textContent = `0 / ${config.steps.length}`;
      if (trigger) {
        trigger.textContent = 'Workflow starten';
        trigger.classList.remove('is-running', 'is-complete');
        trigger.removeAttribute('aria-busy');
      }
      if (activeWorkflowController === controller) activeWorkflowController = null;
    };

    const maybeAutoScrollStep = (stepIndex) => {
      const activeNode = nodes[Math.min(stepIndex, nodes.length - 1)];
      const target = activeNode || currentBox || root;
      if (!target) return;
      scrollTargetIntoView(target, {
        block: activeNode ? 'center' : 'nearest',
        padding: isMobileViewport() ? 20 : 34,
        extraOffset: isMobileViewport() ? -4 : 0
      });
    };

    const runStep = (stepIndex) => {
      index = stepIndex;
      applyStepState(stepIndex);
      maybeAutoScrollStep(stepIndex);
      const current = config.steps[stepIndex];
      if (current) {
        if (statusText) statusText.textContent = current.title;
        if (currentTitle) currentTitle.textContent = current.title;
        if (descriptionText) descriptionText.textContent = current.description;
        if (progressText) progressText.textContent = `${stepIndex + 1} / ${config.steps.length}`;
      }
      if (stepIndex >= config.steps.length - 1) {
        if (statusText) statusText.textContent = 'Abgeschlossen';
        if (progressText) progressText.textContent = `${config.steps.length} / ${config.steps.length}`;
        if (trigger) {
          trigger.textContent = 'Erneut starten';
          trigger.classList.remove('is-running');
          trigger.classList.add('is-complete');
          trigger.removeAttribute('aria-busy');
        }
        clearTimer();
        return;
      }
      const mobileDelay = window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches ? 2450 : 2350;
      timer = setTimeout(() => runStep(stepIndex + 1), mobileDelay);
    };

    const controller = { root, stop: reset };

    const run = () => {
      if (activeWorkflowController && activeWorkflowController.root !== root) {
        activeWorkflowController.stop();
      }
      activeWorkflowController = controller;
      clearTimer();
      nodes.forEach((node) => node.classList.remove('active', 'done'));
      if (trigger) {
        trigger.textContent = 'Workflow läuft …';
        trigger.classList.add('is-running');
        trigger.classList.remove('is-complete');
        trigger.setAttribute('aria-busy', 'true');
      }
      runStep(0);
    };

    if (trigger) trigger.addEventListener('click', run);
    window.addEventListener('workflow:stop-active', () => {
      if (activeWorkflowController && activeWorkflowController.root === root) reset();
    });
    reset();
  };
  document.querySelectorAll('[data-workflow]').forEach(initWorkflow);

  const searchItems = [
    { title: 'Digitale Lösungen', text: 'Individuelle Apps, Automatisierungen und Tools für konkrete Probleme im Arbeitsalltag.', url: 'index.html#hero', keywords: 'app business app workflow automatisierung tool lösung problem' },
    { title: 'Schlüsseldienst-App', text: 'Ausweis per OCR scannen, Kundendaten übernehmen und Rechnungen direkt vor Ort als PDF erstellen.', url: 'beispiele.html#beispiel-schluesseldienst-app', keywords: 'schlüsseldienst schluesseldienst ocr ausweis rechnung pdf app' },
    { title: 'Business-Apps', text: 'Kleine Web- oder App-Lösungen für interne Abläufe, Außendienst und Datenerfassung.', url: 'leistungen.html#apps', keywords: 'app tool webapp intern außendienst aussendienst' },
    { title: 'Workflow-Automatisierung', text: 'Wiederkehrende Aufgaben automatisieren, Anfragen sortieren und Informationen weiterleiten.', url: 'leistungen.html#automatisierung', keywords: 'workflow n8n automatisierung email formular webhook' },
    { title: 'OCR und Dokumente', text: 'Daten aus Ausweisen, Formularen oder Dokumenten erfassen und weiterverarbeiten.', url: 'leistungen.html#ocr', keywords: 'ocr scan ausweis dokumente erfassung' },
    { title: 'Rechnungen und PDFs', text: 'Aus einmal erfassten Daten automatisch Rechnungen, Angebote oder PDF-Dokumente erzeugen.', url: 'leistungen.html#pdf', keywords: 'rechnung angebot pdf dokument' },
    { title: 'Schnittstellen', text: 'Bestehende Tools verbinden, damit Daten nicht doppelt übertragen werden müssen.', url: 'leistungen.html#schnittstellen', keywords: 'schnittstelle api tool verbinden' },
    { title: 'Praxisbeispiele', text: 'Konkrete Beispiele für Apps, OCR, Dokumentenprozesse, Kontaktformulare und Automatisierungen.', url: 'beispiele.html', keywords: 'beispiele use cases lösungen' },
    { title: 'Einsatzbereiche', text: 'Handwerk, Dienstleister, Außendienst, Büros mit vielen Anfragen und interne Abläufe.', url: 'einsatzbereiche.html', keywords: 'handwerk dienstleister außendienst office dokumente' },
    { title: 'Kontaktformular', text: 'Anfrage mit Thema, Beschreibung, Rückrufoption und n8n-Anbindung senden.', url: 'kontakt.html#kontaktformular', keywords: 'kontakt anfrage formular rückruf n8n' },
  ];

  document.querySelectorAll('.search-input').forEach((input) => {
    input.setAttribute('placeholder', 'Suche');
    input.setAttribute('aria-label', 'Website durchsuchen');
  });

  const searchRoots = [...document.querySelectorAll('[data-search-root]')];
  searchRoots.forEach((searchRoot, rootIndex) => {
    const input = searchRoot.querySelector('[data-search-input]');
    const results = searchRoot.querySelector('[data-search-results]');
    if (!input || !results) return;

    const normalizeSearch = (value) => String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const levenshtein = (a, b) => {
      const aa = normalizeSearch(a);
      const bb = normalizeSearch(b);
      if (!aa) return bb.length;
      if (!bb) return aa.length;
      const dp = Array.from({ length: aa.length + 1 }, (_, i) => [i]);
      for (let j = 1; j <= bb.length; j += 1) dp[0][j] = j;
      for (let i = 1; i <= aa.length; i += 1) {
        for (let j = 1; j <= bb.length; j += 1) {
          const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
      }
      return dp[aa.length][bb.length];
    };

    const synonymGroups = {
      email: ['email','e mail','mail','postfach','postfaecher','posteingang','inbox','kundenantwort','autoantwort','erstantwort'],
      termine: ['termin','termine','kalender','buchung','terminbuchung','erinnerung','rueckruf'],
      dokumente: ['dokument','dokumente','datei','dateien','angebot','angebote','rechnung','rechnungen','pdf','ablage','anhang'],
      support: ['support','service','ticket','reklamation','hilfe'],
      intern: ['intern','weiterleitung','zustaendigkeit','status','uebergabe'],
      app: ['app','apps','webapp','business app','tool','software','ocr','scan','ausweis'],
      faq: ['faq','fragen','hilfe','info'],
      workflow: ['workflow','automatisierung','prozess','prozesse','ablauf','ablaeufe','n8n','webhook']
    };

    const buildKeywords = (item) => {
      const raw = `${item.title || ''} ${item.text || ''} ${item.keywords || ''}`;
      const normalized = normalizeSearch(raw);
      const tokens = [...new Set(normalized.split(/\s+/).filter(Boolean))];
      Object.values(synonymGroups).forEach((group) => {
        if (group.some((term) => normalized.includes(normalizeSearch(term)))) tokens.push(...group.map(normalizeSearch));
      });
      return [...new Set(tokens)].filter(Boolean);
    };

    const searchIndex = searchItems.map((item) => ({
      ...item,
      normalized: normalizeSearch(`${item.title || ''} ${item.text || ''} ${item.keywords || ''}`),
      keywordsList: buildKeywords(item)
    }));

    const renderResults = (value) => {
      const queryRaw = value.trim();
      const query = normalizeSearch(queryRaw);
      results.innerHTML = '';
      if (!query) {
        results.classList.add('hidden');
        return;
      }

      const directMatches = searchIndex
        .map((item) => ({ item, score: item.normalized.includes(query) ? 100 : 0 }))
        .filter((entry) => entry.score > 0)
        .slice(0, 6);

      if (directMatches.length) {
        results.classList.remove('hidden');
        results.innerHTML = directMatches.map(({ item }) => `
          <a class="search-result" href="${item.url}">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
            <small>${item.url.replace('.html', '').replace('#', ' → ')}</small>
          </a>
        `).join('');
        return;
      }

      const scored = searchIndex.map((item) => {
        let score = 0;
        item.keywordsList.forEach((token) => {
          if (token === query) score = Math.max(score, 95);
          else if (token.startsWith(query) || query.startsWith(token)) score = Math.max(score, 78);
          else if (token.includes(query) || query.includes(token)) score = Math.max(score, 72);
          else {
            const dist = levenshtein(query, token);
            if (dist <= 1) score = Math.max(score, 70);
            else if (dist === 2 && query.length > 4) score = Math.max(score, 60);
          }
        });
        Object.entries(synonymGroups).forEach(([key, group]) => {
          const matchesGroup = group.some((term) => {
            const normalizedTerm = normalizeSearch(term);
            const dist = levenshtein(query, normalizedTerm);
            return normalizedTerm.includes(query) || query.includes(normalizedTerm) || dist <= (query.length > 5 ? 2 : 1);
          });
          if (matchesGroup && item.keywordsList.includes(normalizeSearch(key))) score = Math.max(score, 68);
        });
        return { item, score };
      }).filter((entry) => entry.score >= 60).sort((a, b) => b.score - a.score).slice(0, 5);

      results.classList.remove('hidden');
      if (!scored.length) {
        results.innerHTML = '<div class="search-result"><h3>Keine direkten Treffer</h3><p>Zu diesem Begriff wurden keine exakten Ergebnisse gefunden. Versuche Begriffe wie E-Mail, Postfach, Termin, Dokumente, Angebote oder FAQ.</p></div>';
        return;
      }

      results.innerHTML = `
        <div class="search-result suggestion-note">
          <h3>Keine direkten Treffer</h3>
          <p>Zu „${queryRaw.replace(/</g, '&lt;')}“ wurden keine exakten Ergebnisse gefunden. Vielleicht ist einer dieser Bereiche gemeint:</p>
        </div>
        ${scored.map(({ item }) => `
          <a class="search-result" href="${item.url}">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
            <small>${item.url.replace('.html', '').replace('#', ' → ')}</small>
          </a>
        `).join('')}
      `;
    };

    input.addEventListener('input', (event) => renderResults(event.target.value));
    input.addEventListener('focus', (event) => renderResults(event.target.value));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const firstLink = results.querySelector('a.search-result');
        if (firstLink) {
          event.preventDefault();
          window.location.href = firstLink.href;
        }
      }
      if (event.key === 'Escape') results.classList.add('hidden');
    });

    document.addEventListener('click', (event) => {
      if (!searchRoot.contains(event.target)) results.classList.add('hidden');
    });

    if (rootIndex === 0) {
      document.addEventListener('keydown', (event) => {
        if ((event.key === '/' || (event.altKey && event.key.toLowerCase() === 'k')) && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
          event.preventDefault();
          input.focus();
        }
      });
    }
  });

  document.querySelectorAll('[data-config]').forEach((node) => {
    const key = node.getAttribute('data-config');
    const value = window.siteConfig && Object.prototype.hasOwnProperty.call(window.siteConfig, key)
      ? String(window.siteConfig[key] || '').trim()
      : '';

    if (!value) {
      const removableParent = node.closest('[data-config-wrap], .status-pill, .footer-links > a, .footer-links > span');
      if (removableParent) removableParent.remove();
      else node.remove();
      return;
    }

    node.textContent = value;
    if (node.tagName === 'A') {
      if (key === 'email') node.href = `mailto:${value}`;
      if (key === 'phone') node.href = `tel:${value.replace(/\s+/g, '')}`;
    }
  });


  const WORKFLOW_RESULT_STORAGE_KEY = 'deppmeyer-workflow-check-result';
  const readStoredWorkflowResult = () => {
    try {
      const raw = window.sessionStorage.getItem(WORKFLOW_RESULT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const title = String(parsed.title || '').trim();
      const summary = String(parsed.summary || '').trim();
      if (!title || !summary) return null;
      return {
        title,
        summary,
        topic: String(parsed.topic || '').trim(),
        examples: String(parsed.examples || '').trim()
      };
    } catch (error) {
      return null;
    }
  };
  const writeStoredWorkflowResult = (result) => {
    try {
      if (!result || !result.title || !result.summary) {
        window.sessionStorage.removeItem(WORKFLOW_RESULT_STORAGE_KEY);
        return;
      }
      window.sessionStorage.setItem(WORKFLOW_RESULT_STORAGE_KEY, JSON.stringify({
        title: String(result.title || '').trim(),
        summary: String(result.summary || '').trim(),
        topic: String(result.topic || '').trim(),
        examples: String(result.examples || '').trim()
      }));
    } catch (error) {}
  };
  const clearStoredWorkflowResult = () => {
    try {
      window.sessionStorage.removeItem(WORKFLOW_RESULT_STORAGE_KEY);
    } catch (error) {}
  };

  const initWorkflowCheck = () => {
    const shell = document.querySelector('[data-workflow-check]');
    const toggle = document.querySelector('[data-workflow-check-toggle]');
    if (!shell || !toggle) return;
    const toggleOpenLabel = toggle.getAttribute('data-workflow-check-open-label') || 'Schnellcheck öffnen';
    const toggleCloseLabel = toggle.getAttribute('data-workflow-check-close-label') || 'Schnellcheck schließen';
    const form = shell.querySelector('[data-workflow-check-form]');
    const fieldsets = [...form.querySelectorAll('fieldset')];
    const progress = form.querySelector('[data-workflow-check-progress]');
    const resultBox = shell.querySelector('[data-workflow-check-result]');
    shell.hidden = true;
    if (resultBox) resultBox.hidden = true;
    const resultTitle = shell.querySelector('[data-workflow-check-title]');
    const resultCopy = shell.querySelector('[data-workflow-check-copy]');
    const resultBullets = shell.querySelector('[data-workflow-check-bullets]');
    const contactLink = shell.querySelector('[data-workflow-check-contact-link]');
    const exampleLink = shell.querySelector('[data-workflow-check-example-link]');
    const applyButton = shell.querySelector('[data-workflow-check-apply]');
    const discardButton = shell.querySelector('[data-workflow-check-discard]');
    const prevButton = shell.querySelector('[data-workflow-check-prev]');
    const nextButton = shell.querySelector('[data-workflow-check-next]');
    const evaluateButton = shell.querySelector('[data-workflow-check-evaluate]');
    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
    let currentStep = 0;
    let currentResult = null;

    const resultMap = {
      email: {
        title: 'Besonders sinnvoll: Postfach-Automatisierung und automatische Antworten',
        copy: 'Ihre Antworten deuten darauf hin, dass eingehende Nachrichten, Standardanfragen oder wiederkehrende Rückfragen im Postfach besonders viel Zeit binden. Ein durchdachter E-Mail-Workflow sorgt dafür, dass Anfragen schneller sortiert, zugewiesen und mit einer passenden Erstantwort vorbereitet werden.',
        bullets: ['Typisch sinnvoll bei vielen ähnlichen Kundenanfragen oder zentralen Funktionspostfächern.', 'Möglich sind automatische Sortierung, Erstantwort, Anhänge, Weiterleitung und Statuslogik.', 'Gerade im Tagesgeschäft sinken Rückfragen und unnötige manuelle Zwischenschritte spürbar.'],
        topic: 'E-Mail- und Postfachprozesse',
        examples: 'beispiele.html#beispiel-email-sortierung'
      },
      termine: {
        title: 'Besonders sinnvoll: Automatische Terminbuchung und Rückmeldelogik',
        copy: 'Ihre Antworten passen besonders gut zu einem Ablauf, der Terminwünsche übernimmt, freie Zeiten prüft und Bestätigungen oder Erinnerungen automatisch vorbereitet. So wird aus einem zeitaufwendigen Hin und Her ein verlässlicher Prozess.',
        bullets: ['Typisch sinnvoll bei Beratungs-, Service- oder Vor-Ort-Terminen.', 'Möglich sind Terminabgleich, Bestätigung, Erinnerungen und saubere Dokumentation.', 'Gerade bei wiederkehrenden Terminprozessen lassen sich viele Minuten pro Vorgang sparen.'],
        topic: 'Automatische Terminbuchung',
        examples: 'beispiele.html#beispiel-terminprozess'
      },
      dokumente: {
        title: 'Besonders sinnvoll: Angebots- und Dokumentenabläufe strukturieren',
        copy: 'Ihre Antworten zeigen, dass Angebotsdaten, Dokumente oder Anhänge besser vorbereitet und übergeben werden können. Ein sauberer Workflow übernimmt Informationen, strukturiert Inhalte und reduziert manuelle Nacharbeit.',
        bullets: ['Typisch sinnvoll bei Angeboten, Anhängen, Unterlagen und standardisierten Dokumenten.', 'Möglich sind Vorbereitung von Angebotsdaten, Benennung, Ablage und Statusweitergabe.', 'So entstehen weniger Rückfragen und eine deutlich geordnetere Bearbeitung im Alltag.'],
        topic: 'Angebots- und Antwortvorbereitung',
        examples: 'beispiele.html#beispiel-angebotsvorbereitung'
      },
      intern: {
        title: 'Besonders sinnvoll: Interne Weiterleitungen und Zuständigkeiten ordnen',
        copy: 'Ihre Antworten deuten darauf hin, dass vor allem interne Übergaben, Freigaben oder Rückmeldungen geordneter laufen sollten. Ein strukturierter Ablauf bündelt Informationen, weist Zuständigkeiten sauber zu und hält den aktuellen Stand sichtbar.',
        bullets: ['Typisch sinnvoll bei internen Anfragen, Freigaben oder Rückmeldungen zwischen Teams.', 'Möglich sind Zuständigkeitslogik, Statusmeldungen und nachvollziehbare Übergaben.', 'Dadurch sinken Suchaufwand, Abstimmungsrunden und personengebundene Sonderwege.'],
        topic: 'Interne Weiterleitungen und Zuständigkeiten',
        examples: 'beispiele.html#beispiel-interne-freigabe'
      },
      mix: {
        title: 'Besonders sinnvoll: Mit einem kleinen Kern-Workflow starten',
        copy: 'Ihre Antworten zeigen, dass nicht nur ein einzelner Schritt Zeit kostet, sondern mehrere kleine Abläufe zusammenspielen. In solchen Fällen ist meist ein Start mit dem größten Engpass am sinnvollsten, damit Entlastung schnell spürbar wird und später sinnvoll erweitert werden kann.',
        bullets: ['Typisch sinnvoll, wenn E-Mails, Termine, Dokumente und Übergaben gleichzeitig eine Rolle spielen.', 'Empfohlen wird ein schlanker Start mit dem größten Zeitfresser und einer sinnvollen Ausbauperspektive.', 'So entsteht keine unnötig große Lösung, sondern ein Schritt, der im Alltag sofort hilft.'],
        topic: 'Allgemeine Prozessoptimierung',
        examples: 'beispiele.html#beispiel-schluesseldienst-app'
      }
    };

    const categoryScores = ['email','termine','dokumente','intern','mix'];

    const currentFieldAnswered = () => {
      const field = fieldsets[currentStep];
      if (!field) return true;
      const name = field.querySelector('input[type="radio"]')?.name;
      return name ? Boolean(form.querySelector(`input[name="${name}"]:checked`)) : true;
    };

    const updateActionButtons = () => {
      const isLastStep = currentStep >= fieldsets.length - 1;
      const answered = currentFieldAnswered();
      if (prevButton) prevButton.hidden = currentStep === 0;
      if (nextButton) nextButton.hidden = true;
      if (evaluateButton) evaluateButton.hidden = !isLastStep || !answered;
    };

    const updateStep = (index = 0, options = {}) => {
      currentStep = Math.max(0, Math.min(index, fieldsets.length - 1));
      fieldsets.forEach((field, fieldIndex) => { field.hidden = fieldIndex !== currentStep; });
      if (progress) progress.textContent = `Frage ${currentStep + 1} von ${fieldsets.length}`;
      updateActionButtons();
      if (resultBox && !options.keepResult) resultBox.hidden = true;
      if (options.scroll !== false) {
        requestAnimationFrame(() => {
          const target = fieldsets[currentStep];
          if (target) {
            scrollTargetIntoView(target, {
              block: 'nearest',
              force: Boolean(options.instant),
              instant: Boolean(options.instant),
              padding: isMobileViewport() ? 18 : 26
            });
          }
        });
      }
    };

    const openCheck = () => {
      shell.hidden = false;
      toggle.textContent = toggleCloseLabel;
      updateStep(0, { instant: true, scroll: false });
      scrollTargetIntoView(shell, {
        block: 'center',
        force: true,
        padding: isMobileViewport() ? 18 : 30,
        delay: 35
      });
    };
    const closeCheck = () => {
      shell.hidden = true;
      toggle.textContent = toggleOpenLabel;
      if (resultBox) resultBox.hidden = true;
    };
    toggle.addEventListener('click', () => shell.hidden ? openCheck() : closeCheck());

    const focusFirst = () => fieldsets[currentStep]?.querySelector('input')?.focus();

    nextButton?.addEventListener('click', () => {
      if (!currentFieldAnswered()) {
        focusFirst();
        return;
      }
      updateStep(currentStep + 1);
    });
    prevButton?.addEventListener('click', () => updateStep(currentStep - 1));

    const evaluate = () => {
      const formData = new FormData(form);
      const missing = fieldsets.find((field) => !formData.get(field.querySelector('input')?.name || ''));
      if (missing) {
        const missingIndex = fieldsets.indexOf(missing);
        updateStep(missingIndex, { scroll: true });
        missing.querySelector('input')?.focus();
        return;
      }
      const scores = { email: 0, termine: 0, dokumente: 0, intern: 0, mix: 0, formular: 0 };
      [...form.querySelectorAll('input[type="radio"]:checked')].forEach((input) => {
        const key = input.value;
        const add = Number(input.getAttribute('data-score') || 0);
        if (scores[key] !== undefined) scores[key] += add;
      });
      scores.email += Math.round((scores.formular || 0) * 0.6);
      scores.dokumente += Math.round((scores.formular || 0) * 0.5);
      const winner = [...categoryScores].sort((a, b) => scores[b] - scores[a])[0] || 'mix';
      const result = resultMap[winner] || resultMap.mix;
      currentResult = { title: result.title, summary: result.copy, topic: result.topic, examples: result.examples };
      writeStoredWorkflowResult(currentResult);
      resultTitle.textContent = result.title;
      resultCopy.textContent = result.copy;
      resultBullets.innerHTML = result.bullets.map((entry) => `<li>${entry}</li>`).join('');
      if (contactLink) {
        const params = new URLSearchParams({ assessment: result.title, summary: result.copy, topic: result.topic });
        contactLink.href = `kontakt.html?${params.toString()}#kontaktformular`;
      }
      if (exampleLink) exampleLink.href = result.examples;
      resultBox.hidden = false;
      scrollTargetIntoView(resultBox, { block: 'center', force: true, padding: isMobileViewport() ? 18 : 28, delay: 18 });
    };

    evaluateButton?.addEventListener('click', evaluate);
    applyButton?.addEventListener('click', () => {
      if (!currentResult) return;
      writeStoredWorkflowResult(currentResult);
      shell.dispatchEvent(new CustomEvent('workflowcheck:apply', { bubbles: true, detail: currentResult }));
      currentResult = null;
      form.reset();
      closeCheck();
    });
    discardButton?.addEventListener('click', () => {
      currentResult = null;
      clearStoredWorkflowResult();
      form.reset();
      closeCheck();
    });
    form.addEventListener('change', (event) => {
      currentResult = null;
      if (resultBox && !resultBox.hidden) resultBox.hidden = true;
      updateActionButtons();
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
      const field = target.closest('fieldset');
      const fieldIndex = fieldsets.indexOf(field);
      if (fieldIndex === -1) return;
      currentStep = fieldIndex;
      if (!currentFieldAnswered()) return;
      if (currentStep >= fieldsets.length - 1) {
        window.setTimeout(() => {
          if (fieldsets[currentStep] === field) evaluate();
        }, 60);
        return;
      }
      window.setTimeout(() => {
        if (fieldsets[currentStep] === field) updateStep(currentStep + 1);
      }, 60);
    });
    form.addEventListener('reset', () => {
      setTimeout(() => {
        currentResult = null;
        if (resultBox) resultBox.hidden = true;
        updateStep(0, { instant: true, scroll: false });
      }, 0);
    });

    updateStep(0, { instant: true, scroll: false });
  };
  initWorkflowCheck();

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    const summary = contactForm.querySelector('[data-contact-summary]');
    const submitButton = contactForm.querySelector('[data-contact-submit]');
    const submitDefaultLabel = submitButton ? String(submitButton.textContent || '').trim() || 'Kostenloses Erstgespräch anfragen' : 'Kostenloses Erstgespräch anfragen';
    const responseNote = contactForm.querySelector('[data-contact-note]');
    const defaultResponseNote = responseNote ? responseNote.textContent.trim() : '';
    const responseWrap = contactForm.querySelector('.contact-response');
    const submitHint = contactForm.querySelector('[data-contact-submit-hint]');
    const callbackHintNote = (() => {
      if (!responseWrap) return null;
      const existing = responseWrap.querySelector('[data-callback-choice-note]');
      if (existing) return existing;
      const note = document.createElement('span');
      note.className = 'note';
      note.hidden = true;
      note.setAttribute('aria-live', 'polite');
      note.setAttribute('data-callback-choice-note', '');
      note.textContent = 'Hinweis: Es kann nur eine Option gewählt werden. Mit ausgewähltem Rückruf wird die Anfrage als Rückrufwunsch behandelt.';
      if (responseNote) responseWrap.insertBefore(note, responseNote);
      else responseWrap.appendChild(note);
      return note;
    })();
    const validationHintNote = (() => {
      if (!responseWrap) return null;
      const existing = responseWrap.querySelector('[data-contact-validation-note]');
      if (existing) return existing;
      const note = document.createElement('div');
      note.className = 'note contact-validation-note';
      note.hidden = true;
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      note.setAttribute('data-contact-validation-note', '');
      if (submitButton) responseWrap.insertBefore(note, submitButton);
      else if (callbackHintNote) responseWrap.insertBefore(note, callbackHintNote);
      else if (responseNote) responseWrap.insertBefore(note, responseNote);
      else responseWrap.appendChild(note);
      return note;
    })();
    const emailInput = contactForm.querySelector('#email');
    const emailFeedback = contactForm.querySelector('[data-email-feedback]');
    const consentInput = contactForm.querySelector('#consent');
    const consentFeedback = contactForm.querySelector('[data-consent-feedback]');
    const requiredWrappers = [...contactForm.querySelectorAll('[data-required-field]')];
    const requiredFieldsValid = () => requiredWrappers.every((wrapper) => requiredFieldFilled(wrapper));
    let isSubmitting = false;
    let shouldRevealValidationHint = false;
    const setResponseNote = (message) => {
      if (!responseNote) return;
      responseNote.textContent = message || defaultResponseNote;
    };
    const setValidationHint = (issues = []) => {
      if (!validationHintNote) return;
      const shouldShow = shouldRevealValidationHint && !isSubmitting && issues.length > 0;
      validationHintNote.hidden = !shouldShow;
      validationHintNote.textContent = shouldShow
        ? 'Bitte fülle alle Pflichtfelder korrekt aus, um fortzufahren.'
        : '';
    };
    const getRequiredControl = (wrapper) => wrapper?.querySelector('input, select, textarea');
    const requiredFieldFilled = (wrapper) => {
      const control = getRequiredControl(wrapper);
      if (!control) return false;
      if (control.type === 'checkbox') return control.checked;
      return String(control.value || '').trim().length > 0;
    };
    const syncRequiredMarkers = () => {
      requiredWrappers.forEach((wrapper) => {
        const label = wrapper.querySelector(':scope > label');
        const isConsentWrapper = wrapper.classList.contains('consent-wrap') || label?.classList.contains('consent-check');
        let marker = wrapper.querySelector(':scope > .required-marker, :scope > label > .required-marker');
        if (!marker) {
          marker = document.createElement('span');
          marker.className = 'required-marker';
          marker.textContent = '*';
          marker.setAttribute('aria-hidden', 'true');
        }

        if (isConsentWrapper) {
          if (marker.parentElement !== wrapper) wrapper.appendChild(marker);
          wrapper.style.position = 'relative';
          Object.assign(marker.style, {
            position: 'absolute',
            top: '12px',
            right: '14px',
            color: '#ff5a6f',
            fontSize: '1rem',
            fontWeight: '800',
            lineHeight: '1',
            pointerEvents: 'none',
            zIndex: '3'
          });
        } else if (label) {
          if (marker.parentElement !== label) label.appendChild(marker);
          Object.assign(label.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          });
          Object.assign(marker.style, {
            position: 'static',
            top: '',
            right: '',
            color: '#ff5a6f',
            fontSize: '1rem',
            fontWeight: '800',
            lineHeight: '1',
            pointerEvents: 'none',
            zIndex: ''
          });
        } else if (marker.parentElement !== wrapper) {
          wrapper.appendChild(marker);
        }

        const filled = requiredFieldFilled(wrapper);
        marker.style.display = filled ? 'none' : 'inline-block';
        wrapper.classList.toggle('is-filled', filled);
      });
    };
    const validateEmailValue = (value) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) {
        return { valid: false, state: 'empty', message: 'Bitte eine gültige E-Mail-Adresse angeben.' };
      }
      if (/\s/.test(trimmed)) {
        return { valid: false, state: 'invalid', message: 'Die E-Mail-Adresse darf keine Leerzeichen enthalten.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
        return { valid: false, state: 'invalid', message: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
      }
      return { valid: true, state: 'valid', message: 'E-Mail-Adresse sieht gültig aus.' };
    };
    const validatePhoneValue = (value) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) {
        return { valid: false, state: 'empty', message: 'Bitte eine Telefonnummer für den Rückruf angeben.' };
      }
      const normalized = trimmed.replace(/[^\d+]/g, '');
      if (normalized.length < 7) {
        return { valid: false, state: 'invalid', message: 'Bitte eine Telefonnummer mit ausreichend Stellen angeben.' };
      }
      return { valid: true, state: 'valid', message: 'Telefonnummer für den Rückruf hinterlegt.' };
    };
    const prefillBox = contactForm.querySelector('[data-contact-prefill]');
    const prefillText = contactForm.querySelector('[data-contact-prefill-text]');
    const prefillClearButton = contactForm.querySelector('[data-contact-prefill-clear]');
    const messageField = contactForm.querySelector('#message');
    const topicField = contactForm.querySelector('#topic');
    const phoneInput = contactForm.querySelector('#phone');
    const callbackInput = contactForm.querySelector('#callbackRequested');
    const turnstileWrap = contactForm.querySelector('[data-turnstile-wrap]');
    const turnstileWidget = contactForm.querySelector('[data-turnstile-widget]');
    let turnstileToken = '';
    let turnstileWidgetId = null;
    const turnstileSiteKey = String(window.siteConfig?.turnstileSiteKey || '').trim();
    const turnstileEnabled = Boolean(turnstileSiteKey && turnstileWidget);
    const callbackFeedback = contactForm.querySelector('[data-callback-feedback]');
    const callbackTrigger = contactForm.querySelector('[data-contact-callback-trigger]');
    let pendingStoredAssessment = readStoredWorkflowResult();
    const normalizeTopic = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

    const applyTopicChoice = (resultTopic) => {
      if (!topicField || !resultTopic) return;
      const normalizedTopic = normalizeTopic(resultTopic);
      const option = [...topicField.options].find((entry) => normalizeTopic(entry.textContent).includes(normalizedTopic) || normalizedTopic.includes(normalizeTopic(entry.textContent)));
      if (option) topicField.value = option.value;
    };

    const getAssessmentState = () => ({
      title: String(contactForm.dataset.assessmentTitle || '').trim(),
      summary: String(contactForm.dataset.assessmentSummary || '').trim(),
      topic: String(contactForm.dataset.assessmentTopic || '').trim()
    });

    const getAssessmentText = () => {
      const state = getAssessmentState();
      return state.title && state.summary ? `${state.title}. ${state.summary}` : '';
    };

    const getAssessmentMessage = () => {
      const text = getAssessmentText();
      return text ? `Übernommene Zusammenfassung: ${text}` : '';
    };

    const ensureTurnstileScript = () => new Promise((resolve, reject) => {
      if (!turnstileEnabled) {
        resolve();
        return;
      }
      if (window.turnstile?.render) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-turnstile-script]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Turnstile konnte nicht geladen werden.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-turnstile-script', '');
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Turnstile konnte nicht geladen werden.')), { once: true });
      document.head.appendChild(script);
    });

    const resetTurnstileProtection = () => {
      if (!turnstileEnabled) return;
      turnstileToken = '';
      if (window.turnstile?.reset && turnstileWidgetId !== null) {
        try { window.turnstile.reset(turnstileWidgetId); } catch (error) {}
      }
    };

    const initTurnstileProtection = async () => {
      if (!turnstileEnabled) return;
      if (turnstileWrap) turnstileWrap.hidden = false;
      try {
        await ensureTurnstileScript();
        if (!window.turnstile?.render || turnstileWidgetId !== null) return;
        turnstileWidgetId = window.turnstile.render(turnstileWidget, {
          sitekey: turnstileSiteKey,
          theme: body.dataset.theme === 'dark' ? 'dark' : 'light',
          callback: (token) => {
            turnstileToken = String(token || '');
            updateSummary();
          },
          'expired-callback': () => {
            turnstileToken = '';
            updateSummary();
          },
          'error-callback': () => {
            turnstileToken = '';
            updateSummary();
          }
        });
      } catch (error) {
        setResponseNote('Der Formularschutz konnte nicht geladen werden. Bitte lade die Seite neu oder versuche es später erneut.');
      }
    };

    const syncAssessmentPrefillState = () => {
      const assessmentText = getAssessmentText();
      if (assessmentText) {
        if (prefillBox && prefillText) {
          prefillBox.hidden = false;
          prefillText.textContent = `Übernommene Zusammenfassung: ${assessmentText}`;
        }
        if (prefillClearButton) {
          prefillClearButton.hidden = false;
          prefillClearButton.textContent = 'Zusammenfassung entfernen';
          prefillClearButton.dataset.prefillMode = 'clear';
        }
        return;
      }

      if (pendingStoredAssessment?.title && pendingStoredAssessment?.summary) {
        if (prefillBox && prefillText) {
          prefillBox.hidden = false;
          prefillText.textContent = `Gespeicherte Zusammenfassung verfügbar: ${pendingStoredAssessment.title}. ${pendingStoredAssessment.summary}`;
        }
        if (prefillClearButton) {
          prefillClearButton.hidden = false;
          prefillClearButton.textContent = 'Zusammenfassung einfügen';
          prefillClearButton.dataset.prefillMode = 'insert';
        }
        return;
      }

      if (prefillBox && prefillText) {
        prefillBox.hidden = true;
        prefillText.textContent = '';
      }
      if (prefillClearButton) {
        prefillClearButton.hidden = true;
        prefillClearButton.textContent = 'Zusammenfassung entfernen';
        prefillClearButton.dataset.prefillMode = '';
      }
    };

    const setAssessmentPrefill = ({ title = '', summary = '', topic = '' } = {}) => {
      const nextTitle = String(title || '').trim();
      const nextSummary = String(summary || '').trim();
      const nextTopic = String(topic || '').trim();

      contactForm.dataset.assessmentTitle = nextTitle;
      contactForm.dataset.assessmentSummary = nextSummary;
      contactForm.dataset.assessmentTopic = nextTopic;

      if (nextTopic) applyTopicChoice(nextTopic);

      contactForm.dataset.assessmentAutofillText = '';

      syncAssessmentPrefillState();
    };

    const clearAssessmentPrefill = () => {
      pendingStoredAssessment = null;
      clearStoredWorkflowResult();
      setAssessmentPrefill({});
      updateSummary();
    };

    const applyAssessmentPrefill = () => {
      const params = new URLSearchParams(window.location.search);
      const resultTitle = params.get('assessment');
      const resultSummary = params.get('summary');
      const resultTopic = params.get('topic');
      if (resultTitle && resultSummary) {
        pendingStoredAssessment = { title: resultTitle, summary: resultSummary, topic: String(resultTopic || '').trim() };
        writeStoredWorkflowResult(pendingStoredAssessment);
        setAssessmentPrefill(pendingStoredAssessment);
        return;
      }
      syncAssessmentPrefillState();
    };
    applyAssessmentPrefill();

    document.addEventListener('workflowcheck:apply', (event) => {
      const detail = event.detail || {};
      if (!detail.title || !detail.summary) return;
      pendingStoredAssessment = { title: detail.title, summary: detail.summary, topic: detail.topic || '', examples: detail.examples || '' };
      writeStoredWorkflowResult(pendingStoredAssessment);
      setAssessmentPrefill(pendingStoredAssessment);
      updateSummary();
      requestAnimationFrame(() => {
        scrollTargetIntoView(contactForm, { block: 'center', force: true, padding: isMobileViewport() ? 18 : 28 });
      });
    });

    prefillClearButton?.addEventListener('click', () => {
      if (prefillClearButton.dataset.prefillMode === 'insert' && pendingStoredAssessment) {
        setAssessmentPrefill(pendingStoredAssessment);
        updateSummary();
        requestAnimationFrame(() => {
          scrollTargetIntoView(contactForm, { block: 'center', force: true, padding: isMobileViewport() ? 18 : 28 });
        });
        return;
      }
      clearAssessmentPrefill();
      setResponseNote(defaultResponseNote);
    });

    callbackTrigger?.addEventListener('click', () => {
      if (callbackInput) callbackInput.checked = true;
      if (topicField && !String(topicField.value || '').trim()) topicField.value = 'Allgemeine Prozessoptimierung';
      updateSummary();
      requestAnimationFrame(() => {
        if (phoneInput) phoneInput.focus();
        scrollTargetIntoView(contactForm, { block: 'center', force: true, padding: isMobileViewport() ? 18 : 28 });
      });
    });

    const callbackParam = new URLSearchParams(window.location.search).get('callback');
    if (callbackParam && callbackInput) callbackInput.checked = true;

    const updateSummary = () => {
      const formData = new FormData(contactForm);
      const emailState = validateEmailValue(formData.get('email'));
      const consentGiven = Boolean(formData.get('consent'));
      const turnstileReady = !turnstileEnabled || Boolean(turnstileToken);
      const callbackRequested = Boolean(formData.get('callbackRequested'));
      if (callbackHintNote) callbackHintNote.hidden = !callbackRequested;
      const phoneState = callbackRequested ? validatePhoneValue(formData.get('phone')) : { valid: true, state: 'idle', message: 'Rückruf ist optional.' };
      const genderValue = String(formData.get('gender') || '').trim();
      const firstNameValue = String(formData.get('firstName') || '').trim();
      const lastNameValue = String(formData.get('name') || '').trim();
      const companyValue = String(formData.get('company') || '').trim();
      const fullName = [firstNameValue, lastNameValue].filter(Boolean).join(' ').trim();
      const salutation = genderValue === 'male' ? 'Herr' : (genderValue === 'female' ? 'Frau' : '');
      const compactName = fullName ? (salutation ? `${salutation} ${fullName}` : fullName) : '—';
      const compactContact = companyValue ? `${compactName} · ${companyValue}` : compactName;
      const lines = [
        ['Kontakt', compactContact],
        ['E-Mail', formData.get('email') || '—'],
        ['Telefon', formData.get('phone') || '—'],
        ['Rückruf', callbackRequested ? 'Gewünscht' : 'Nicht angefragt'],
        ['Thema', formData.get('topic') || '—'],
        ['Text', formData.get('message') || '—'],
        ['Übernahme', getAssessmentText() || '—'],
        ['Einwilligung', consentGiven ? 'Bestätigt' : 'Ausstehend']
      ];
      if (summary) {
        summary.replaceChildren();
        lines.forEach(([label, value]) => {
          const row = document.createElement('div');
          const strong = document.createElement('strong');
          strong.textContent = `${label}:`;
          row.appendChild(strong);
          row.appendChild(document.createTextNode(` ${String(value || '—')}`));
          summary.appendChild(row);
        });
      }
      syncRequiredMarkers();
      if (emailInput) {
        emailInput.classList.toggle('is-valid', emailState.valid);
        emailInput.classList.toggle('is-invalid', !emailState.valid && emailState.state !== 'empty');
        emailInput.setAttribute('aria-invalid', String(!emailState.valid && emailState.state !== 'empty'));
        emailInput.setCustomValidity(emailState.valid || emailState.state === 'empty' ? '' : emailState.message);
      }
      if (emailFeedback) {
        emailFeedback.textContent = emailState.message;
        emailFeedback.classList.toggle('is-valid', emailState.valid);
        emailFeedback.classList.toggle('is-invalid', !emailState.valid && emailState.state !== 'empty');
      }
      if (consentInput) {
        consentInput.setCustomValidity(consentGiven ? '' : 'Bitte die Einwilligung zur Datenverarbeitung bestätigen.');
        consentInput.setAttribute('aria-invalid', String(!consentGiven));
      }
      if (consentFeedback) {
        consentFeedback.textContent = consentGiven
          ? 'Einwilligung zur Datenverarbeitung bestätigt.'
          : 'Bitte die Einwilligung zur Datenverarbeitung bestätigen.';
        consentFeedback.classList.toggle('is-valid', consentGiven);
        consentFeedback.classList.toggle('is-invalid', !consentGiven);
      }
      if (phoneInput) {
        phoneInput.classList.toggle('is-valid', callbackRequested && phoneState.valid);
        phoneInput.classList.toggle('is-invalid', callbackRequested && !phoneState.valid && phoneState.state !== 'empty');
        phoneInput.setAttribute('aria-invalid', String(callbackRequested && !phoneState.valid && phoneState.state !== 'empty'));
        phoneInput.setCustomValidity(callbackRequested && !phoneState.valid ? phoneState.message : '');
      }
      if (callbackFeedback) {
        callbackFeedback.textContent = callbackRequested
          ? phoneState.message
          : 'Optional: Für einen Rückruf bitte Telefonnummer angeben und Rückruf aktivieren.';
        callbackFeedback.classList.toggle('is-valid', callbackRequested && phoneState.valid);
        callbackFeedback.classList.toggle('is-invalid', callbackRequested && !phoneState.valid);
      }
      const validationIssues = [];
      if (!emailState.valid) {
        validationIssues.push(emailState.state === 'empty'
          ? 'gültige E-Mail-Adresse eingeben'
          : 'E-Mail-Adresse korrigieren');
      }
      if (callbackRequested && !phoneState.valid) {
        validationIssues.push(phoneState.state === 'empty'
          ? 'Telefonnummer für den Rückruf angeben'
          : 'Telefonnummer für den Rückruf prüfen');
      }
      if (!consentGiven) {
        validationIssues.push('Datenschutz-Einwilligung bestätigen');
      }
      if (!turnstileReady) {
        validationIssues.push('Formularschutz bestätigen');
      }
      if (!requiredFieldsValid()) {
        validationIssues.push('alle Pflichtfelder ausfüllen');
      }
      setValidationHint(validationIssues);
      const canProceed = emailState.valid && consentGiven && turnstileReady && phoneState.valid && requiredFieldsValid() && !isSubmitting;
      if (submitHint) {
        submitHint.textContent = canProceed
          ? 'Alle Pflichtfelder sind ausgefüllt. Du kannst die Anfrage jetzt absenden.'
          : 'Bitte fülle alle Pflichtfelder aus und bestätige den Datenschutz, damit du die Anfrage absenden kannst.';
        submitHint.classList.toggle('is-ready', canProceed);
      }
      if (submitButton) {
        submitButton.disabled = !canProceed;
        submitButton.setAttribute('aria-disabled', String(!canProceed));
        submitButton.classList.toggle('is-disabled', !canProceed);
      }
    };

    initTurnstileProtection();

    const applyChatAssistantPrefill = () => {
      const params = new URLSearchParams(window.location.search);
      const chatText = String(params.get('chat') || '').trim().slice(0, 1200);
      if (!chatText || !messageField) return;
      const nextMessage = `Vorbereitung durch den Ablauf-Assistenten:\n\n${chatText}`;
      if (!String(messageField.value || '').trim()) messageField.value = nextMessage;
      if (topicField && !String(topicField.value || '').trim()) topicField.value = 'Ich bin mir noch nicht sicher';
      setResponseNote('Die Zusammenfassung aus dem Ablauf-Assistenten wurde in die Beschreibung übernommen. Du kannst sie vor dem Absenden noch anpassen.');
    };

    applyChatAssistantPrefill();

    contactForm.addEventListener('input', () => {
      shouldRevealValidationHint = true;
      if (!isSubmitting) updateSummary();
    });
    contactForm.addEventListener('change', () => {
      shouldRevealValidationHint = true;
      if (!isSubmitting) updateSummary();
    });
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const emailState = validateEmailValue(formData.get('email'));
      const consentGiven = Boolean(formData.get('consent'));
      const turnstileReady = !turnstileEnabled || Boolean(turnstileToken);
      const callbackRequested = Boolean(formData.get('callbackRequested'));
      const phoneState = callbackRequested ? validatePhoneValue(formData.get('phone')) : { valid: true };
      const missingRequired = requiredWrappers.find((wrapper) => !requiredFieldFilled(wrapper));
      if (!emailState.valid || !consentGiven || !turnstileReady || !phoneState.valid || missingRequired) {
        shouldRevealValidationHint = true;
        updateSummary();
        const missingControl = missingRequired ? getRequiredControl(missingRequired) : null;
        if (missingControl) missingControl.focus();
        else if (!emailState.valid && emailInput) emailInput.focus();
        else if (!phoneState.valid && phoneInput) phoneInput.focus();
        else if (consentInput) consentInput.focus();
        return;
      }
      if (isSubmitting) return;
      isSubmitting = true;
      let submitSucceeded = false;
      if (submitButton) {
        submitButton.textContent = 'Wird gesendet...';
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
        submitButton.classList.add('is-disabled', 'is-loading');
        submitButton.classList.remove('is-success');
      }
      setResponseNote('Anfrage wird gesendet...');
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
  gender: String(formData.get('gender') || '').trim(),
  firstName: String(formData.get('firstName') || '').trim(),
  name: String(formData.get('name') || '').trim(),
  company: String(formData.get('company') || '').trim(),
  email: String(formData.get('email') || '').trim(),
  topic: String(formData.get('topic') || '').trim(),
  message: String(formData.get('message') || '').trim(),
  phone: String(formData.get('phone') || '').trim(),
  callbackRequested: Boolean(formData.get('callbackRequested')),
  consent: consentGiven,
  assessment: getAssessmentText(),
  turnstileToken
})
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.message || 'Die Anfrage konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.');
        }
        contactForm.reset();
        applyAssessmentPrefill();
        shouldRevealValidationHint = false;
        submitSucceeded = true;
        if (submitButton) {
          submitButton.textContent = 'Anfrage gesendet';
          submitButton.classList.remove('is-loading');
          submitButton.classList.add('is-success');
        }
        updateSummary();
        setResponseNote(result.message || 'Anfrage erfolgreich gesendet.');
      } catch (error) {
        setResponseNote(error && error.message ? error.message : 'Die Anfrage konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.');
      } finally {
        isSubmitting = false;
        resetTurnstileProtection();
        if (submitButton) {
          submitButton.classList.remove('is-loading');
          if (submitSucceeded) {
            window.setTimeout(() => {
              submitButton.classList.remove('is-success');
              submitButton.textContent = submitDefaultLabel;
              updateSummary();
            }, 1800);
          } else {
            submitButton.textContent = submitDefaultLabel;
          }
        }
        updateSummary();
      }
    });
    updateSummary();
  }

  document.querySelectorAll('a.btn[href="kontakt.html"]').forEach((link) => {
    link.setAttribute('href', 'kontakt.html#kontaktformular');
  });

  if (body.dataset.page === 'kontakt.html' && window.location.hash === '#kontaktformular') {
    window.setTimeout(() => {
      const contactSection = document.getElementById('kontaktformular');
      if (contactSection) {
        scrollTargetIntoView(contactSection, {
          block: 'center',
          force: true,
          padding: isMobileViewport() ? 18 : 28
        });
      }
    }, 80);
  }


  const alignExampleHashTarget = () => {
    if (body.dataset.page !== 'beispiele.html' || !window.location.hash) return;
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    } catch (error) {
      target = null;
    }
    if (!target || !target.matches('[data-example-card], .flow-demo-card, .solution-example-card')) return;
    window.setTimeout(() => {
      scrollTargetIntoView(target, {
        block: 'start',
        force: true,
        padding: isMobileViewport() ? 18 : 34,
        instant: true
      });
    }, 80);
    window.setTimeout(() => {
      scrollTargetIntoView(target, {
        block: 'start',
        force: true,
        padding: isMobileViewport() ? 18 : 34
      });
    }, 320);
  };

  alignExampleHashTarget();
  window.addEventListener('hashchange', alignExampleHashTarget);


  const initLeistungenNetwork = () => {
    const root = document.querySelector('[data-logo-network="leistungen"]');
    if (!root) return;
    const svg = root.querySelector('svg');
    const pathElements = [...root.querySelectorAll('[data-flow-path]')];
    const agents = [...root.querySelectorAll('[data-flow-agent]')];
    if (!svg || !pathElements.length || !agents.length) return;
    const paths = pathElements.map((path, index) => ({
      index,
      node: path,
      length: path.getTotalLength()
    }));

    const choosePath = (currentIndex) => {
      const options = paths.filter((entry) => entry.index !== currentIndex);
      const pool = options.length ? options : paths;
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const agentStates = agents.map((node, index) => {
      const seed = choosePath(-1);
      return {
        node,
        current: seed,
        progress: Math.random() * 0.65,
        speed: (node.dataset.flowAgent === 'doc' ? 0.000085 : 0.000115) + Math.random() * 0.00005,
        rotation: 0,
        pauseUntil: performance.now() + index * 260
      };
    });

    const advance = (state, point, nextPoint) => {
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
      state.rotation += (angle - state.rotation) * 0.12;
      state.node.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${state.rotation.toFixed(2)})`);
    };

    let last = performance.now();
    const tick = (now) => {
      const delta = now - last;
      last = now;
      agentStates.forEach((state) => {
        if (now < state.pauseUntil) return;
        state.progress += delta * state.speed;
        if (state.progress >= 1) {
          state.current = choosePath(state.current.index);
          state.progress = 0;
          state.pauseUntil = now + 120 + Math.random() * 520;
        }
        const len = state.current.length;
        const point = state.current.node.getPointAtLength(Math.min(len, state.progress * len));
        const nextPoint = state.current.node.getPointAtLength(Math.min(len, Math.min(0.999, state.progress + 0.01) * len));
        advance(state, point, nextPoint);
      });
      requestAnimationFrame(tick);
    };

    requestAnimationFrame((time) => {
      last = time;
      tick(time);
    });
  };

  initLeistungenNetwork();

  const initSolutionFinder = () => {
    const root = document.querySelector('[data-solution-finder]');
    if (!root) return;

    const data = {
      excel: {
        label: 'Excel-Listen',
        title: 'Excel-Chaos wird zum Dashboard.',
        copy: 'Daten werden einmal sauber erfasst, automatisch geprüft und als übersichtliche Ansicht nutzbar gemacht.',
        bullets: ['Daten einmal erfassen', 'Regeln automatisch prüfen', 'Ergebnis als Übersicht nutzen'],
        link: 'leistungen.html#apps',
        linkText: 'Interne Apps ansehen'
      },
      email: {
        label: 'E-Mails',
        title: 'Aus Postfach-Chaos wird ein klarer Workflow.',
        copy: 'Wiederkehrende Anfragen können erkannt, sortiert und für die nächste Reaktion vorbereitet werden.',
        bullets: ['Anfrage erkennen', 'Priorität oder Thema setzen', 'Antwort oder Aufgabe vorbereiten'],
        link: 'leistungen.html#automatisierung',
        linkText: 'Workflows ansehen'
      },
      forms: {
        label: 'Formulare',
        title: 'Aus losen Angaben wird strukturierte Datenerfassung.',
        copy: 'Formulare sammeln die wichtigen Informationen direkt richtig ein und geben sie an den nächsten Schritt weiter.',
        bullets: ['Pflichtdaten abfragen', 'Fehler reduzieren', 'Daten weiterleiten'],
        link: 'leistungen.html#apps',
        linkText: 'Formularlösungen ansehen'
      },
      pdf: {
        label: 'PDFs/Rechnungen',
        title: 'Aus Eingaben entstehen automatisch fertige Dokumente.',
        copy: 'Rechnungen, Angebote oder Nachweise können aus vorhandenen Daten vorbereitet und als PDF erzeugt werden.',
        bullets: ['Daten übernehmen', 'Vorlage befüllen', 'PDF bereitstellen'],
        link: 'leistungen.html#pdf',
        linkText: 'PDF-Erstellung ansehen'
      },
      web: {
        label: 'Webseite',
        title: 'Aus einer Webseite wird ein geschäftlicher Prozess.',
        copy: 'Wenn eine Webseite nicht nur informieren, sondern Anfragen, Formulare oder Abläufe auslösen soll, kann eine digitale Lösung geprüft werden.',
        bullets: ['Ziel klären', 'Formular oder Ablauf einbinden', 'Anfrage strukturiert weitergeben'],
        link: 'leistungen.html#apps',
        linkText: 'Webbasierte Lösungen ansehen'
      },
      internal: {
        label: 'Interne Abläufe',
        title: 'Aus Übergaben wird ein nachvollziehbarer Prozess.',
        copy: 'Status, Zuständigkeiten und nächste Schritte werden sichtbar, statt in Nachrichten oder Notizen verloren zu gehen.',
        bullets: ['Status festlegen', 'Team informieren', 'Aufgaben nachvollziehbar machen'],
        link: 'beispiele.html#animierte-ablaeufe',
        linkText: 'Beispiele ansehen'
      }
    };

    const chips = [...root.querySelectorAll('[data-finder-key]')];
    const label = root.querySelector('[data-finder-label]');
    const title = root.querySelector('[data-finder-title]');
    const copy = root.querySelector('[data-finder-copy]');
    const bullets = root.querySelector('[data-finder-bullets]');
    const link = root.querySelector('[data-finder-link]');

    const render = (key) => {
      const item = data[key] || data.excel;
      chips.forEach((chip) => chip.classList.toggle('is-active', chip.dataset.finderKey === key));
      if (label) label.textContent = item.label;
      if (title) title.textContent = item.title;
      if (copy) copy.textContent = item.copy;
      if (bullets) {
        bullets.innerHTML = '';
        item.bullets.forEach((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          bullets.appendChild(li);
        });
      }
      if (link) {
        link.href = item.link;
        link.textContent = item.linkText;
      }
    };

    chips.forEach((chip) => chip.addEventListener('click', () => render(chip.dataset.finderKey)));
  };

  initSolutionFinder();

  const initContactConfigurator = () => {
    const root = document.querySelector('[data-contact-configurator]');
    if (!root) return;

    const map = {
      app: {
        topic: 'Individuelle App / internes Tool',
        prefix: 'Ich möchte prüfen lassen, ob eine App oder ein internes Tool sinnvoll ist.',
        example: 'Aktuell werden Daten mehrfach erfasst oder intern per Nachricht weitergegeben.'
      },
      workflow: {
        topic: 'Workflow-Automatisierung',
        prefix: 'Ich möchte prüfen lassen, ob ein Workflow automatisiert werden kann.',
        example: 'Aktuell werden E-Mails, Statusmeldungen oder Aufgaben manuell sortiert und weitergegeben.'
      },
      pdf: {
        topic: 'Rechnung / Angebot / PDF-Erstellung',
        prefix: 'Ich möchte prüfen lassen, ob Rechnungen, Angebote oder PDFs automatisch erstellt werden können.',
        example: 'Aktuell werden Daten erst gesammelt und später manuell in Vorlagen übertragen.'
      },
      ocr: {
        topic: 'OCR / Dokumentenerfassung',
        prefix: 'Ich möchte prüfen lassen, ob Daten aus Dokumenten oder Fotos automatisch erkannt werden können.',
        example: 'Aktuell werden Informationen aus Dokumenten manuell abgetippt oder kopiert.'
      },
      website: {
        topic: 'Kontaktformular / Kundenanfragen',
        prefix: 'Ich möchte prüfen lassen, ob eine Webseite, Landingpage oder ein Formular mit einem digitalen Ablauf verbunden werden kann.',
        example: 'Aktuell sollen Anfragen über die Webseite strukturierter erfasst und weiterverarbeitet werden.'
      }
    };

    let activeKey = 'app';
    const chips = [...root.querySelectorAll('[data-config-topic]')];
    const configText = root.querySelector('[data-contact-config-text]');
    const insertButton = root.querySelector('[data-contact-config-insert]');
    const topicField = document.querySelector('#topic');
    const messageField = document.querySelector('#message');
    const form = document.querySelector('[data-contact-form]');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeKey = chip.dataset.configTopic || 'app';
        chips.forEach((item) => item.classList.toggle('is-active', item === chip));
      });
    });

    insertButton?.addEventListener('click', () => {
      const item = map[activeKey] || map.app;
      const detail = String(configText?.value || '').trim() || item.example;
      if (topicField) {
        const option = [...topicField.options].find((entry) => entry.textContent.trim() === item.topic);
        if (option) topicField.value = option.value || option.textContent;
        topicField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (messageField) {
        const text = `${item.prefix}\n\nAktueller Ablauf:\n${detail}`;
        messageField.value = messageField.value.trim() ? `${messageField.value.trim()}\n\n${text}` : text;
        messageField.dispatchEvent(new Event('input', { bubbles: true }));
        messageField.focus();
      }
      form?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  };

  initContactConfigurator();

  const initChatAssistant = () => {
    if (document.querySelector('[data-chat-assistant]')) return;

    const storageKey = 'deppmeyerChatAssistantConversationV4';
    const openStorageKey = 'deppmeyerChatAssistantOpenV4';
    const greeting = 'Hallo, ich bin dein Ablauf-Assistent. Ich beantworte kurze Fragen zur Webseite und kann grob einschätzen, welche digitale Lösung zu deinem Ablauf passen könnte.';
    const linkLabels = {
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

    const root = document.createElement('section');
    root.className = 'chat-assistant';
    root.setAttribute('data-chat-assistant', '');
    root.setAttribute('aria-label', 'KI-Assistent für digitale Abläufe');
    root.innerHTML = `
      <button class="chat-assistant-toggle" data-chat-toggle type="button" aria-expanded="false" aria-controls="chat-assistant-panel">
        <span class="chat-toggle-icon" aria-hidden="true">✦</span>
        <span class="chat-toggle-text">KI-Assistent</span>
      </button>
      <div class="chat-assistant-panel" id="chat-assistant-panel" data-chat-panel hidden>
        <div class="chat-assistant-head">
          <div>
            <span class="chat-assistant-kicker">Ablauf-Assistent</span>
            <h2>Wie kann ich dir helfen?</h2>
          </div>
          <button class="chat-assistant-close" data-chat-close type="button" aria-label="Assistent schließen">×</button>
        </div>
        <div class="chat-assistant-messages" data-chat-messages aria-live="polite"></div>
        <form class="chat-assistant-form" data-chat-form>
          <textarea data-chat-input aria-label="Frage an den KI-Assistenten" maxlength="900" rows="2" placeholder="Schreib deine Frage ..."></textarea>
          <div class="chat-assistant-actions">
            <span class="chat-assistant-status" data-chat-status>Allgemeine Orientierung – keine verbindliche Beratung.</span>
            <button class="btn btn-small" data-chat-send type="submit">Senden</button>
          </div>
        </form>
        <div class="chat-assistant-footer">
          <a class="chat-contact-link" data-chat-contact href="kontakt.html#kontaktformular">Kontaktformular öffnen</a>
          <a class="chat-contact-link chat-contact-link--transfer" data-chat-transfer href="kontakt.html#kontaktformular" aria-disabled="true">Chat in Anfrage übernehmen</a>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const toggleButton = root.querySelector('[data-chat-toggle]');
    const panel = root.querySelector('[data-chat-panel]');
    const closeButton = root.querySelector('[data-chat-close]');
    const messagesBox = root.querySelector('[data-chat-messages]');
    const form = root.querySelector('[data-chat-form]');
    const input = root.querySelector('[data-chat-input]');
    const status = root.querySelector('[data-chat-status]');
    const sendButton = root.querySelector('[data-chat-send]');
    const contactLink = root.querySelector('[data-chat-contact]');
    const transferLink = root.querySelector('[data-chat-transfer]');
    let conversation = [];
    let isSending = false;
    let typingBubble = null;

    const normalizeLinkHref = (value) => {
      const raw = String(value || '').trim().replace(/[).,;:!?]+$/, '');
      if (linkLabels[raw]) return raw;
      try {
        const url = new URL(raw, window.location.origin);
        const href = `${url.pathname.replace(/^\//, '')}${url.hash}`;
        return linkLabels[href] ? href : '';
      } catch (error) {
        return '';
      }
    };

    const uniqueLinks = (links = []) => {
      const seen = new Set();
      return links
        .map((link) => {
          const href = normalizeLinkHref(typeof link === 'string' ? link : link?.href);
          if (!href || seen.has(href)) return null;
          seen.add(href);
          const customLabel = typeof link === 'object' && typeof link.label === 'string' ? link.label.trim() : '';
          return { href, label: customLabel || linkLabels[href] };
        })
        .filter(Boolean)
        .slice(0, 3);
    };

    const extractLinksFromText = (text) => {
      const safeText = String(text || '');
      const matches = safeText.match(/(?:[\w-]+\.html(?:#[\w-]+)?|https?:\/\/[^\s)]+|\/[\w-]+\.html(?:#[\w-]+)?)/g) || [];
      return uniqueLinks(matches);
    };

    const stripLinkReferences = (text) => {
      let cleaned = String(text || '');
      cleaned = cleaned.replace(/(?:\n|^)[ \t]*(?:siehe auch|passende seiten|mehr dazu|links?)\s*:\s*[\s\S]*$/i, '');
      Object.keys(linkLabels).forEach((href) => {
        const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(`(?:https?:\\/\\/[^\\s]+\\/)?${escaped}`, 'gi'), '');
      });
      return cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    };

    const saveConversation = () => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(conversation.slice(-10)));
      } catch (error) {}
    };

    const loadConversation = () => {
      try {
        const stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
        if (!Array.isArray(stored)) return [];
        return stored
          .filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
          .map((message) => ({
            role: message.role,
            content: message.content.slice(0, 1800),
            links: uniqueLinks(message.links)
          }))
          .slice(-10);
      } catch (error) {
        return [];
      }
    };

    const saveOpenState = (nextOpen) => {
      try {
        sessionStorage.setItem(openStorageKey, nextOpen ? 'open' : 'closed');
      } catch (error) {}
    };

    const loadOpenState = () => {
      try {
        return sessionStorage.getItem(openStorageKey) === 'open';
      } catch (error) {
        return false;
      }
    };

    const setOpen = (nextOpen, { persist = true } = {}) => {
      root.classList.toggle('is-open', nextOpen);
      toggleButton.setAttribute('aria-expanded', String(nextOpen));
      panel.hidden = !nextOpen;
      if (persist) saveOpenState(nextOpen);
      if (nextOpen) window.setTimeout(() => input.focus(), 80);
    };

    const setStatus = (text, state = '') => {
      status.textContent = text;
      status.dataset.state = state;
    };

    const addLinkCards = (bubble, links) => {
      const cleanLinks = uniqueLinks(links);
      if (!cleanLinks.length) return;
      const group = document.createElement('div');
      group.className = 'chat-link-cards';
      cleanLinks.forEach((link) => {
        const anchor = document.createElement('a');
        anchor.className = 'chat-link-card';
        anchor.href = link.href;
        anchor.dataset.chatSmartLink = '';
        const label = document.createElement('span');
        label.textContent = link.label;
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        anchor.append(label, arrow);
        group.appendChild(anchor);
      });
      bubble.appendChild(group);
    };

    const scrollMessageToTop = (bubble, behavior = 'smooth') => {
      if (!bubble) return;
      const top = Math.max(0, bubble.offsetTop - 10);
      messagesBox.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior });
    };

    const addMessage = (role, text, { save = true, links = [], scroll = 'bottom' } = {}) => {
      const linkCards = role === 'assistant' ? uniqueLinks(links.length ? links : extractLinksFromText(text)) : [];
      const displayText = role === 'assistant' ? stripLinkReferences(text) : String(text || '').trim();
      const bubble = document.createElement('div');
      bubble.className = `chat-message chat-message--${role}`;
      const label = document.createElement('span');
      label.className = 'chat-message-label';
      label.textContent = role === 'user' ? 'Du' : 'Assistent';
      const content = document.createElement('p');
      content.textContent = displayText || (role === 'assistant' ? 'Dazu kann ich dir hier nur eine grobe Orientierung geben.' : text);
      bubble.append(label, content);
      addLinkCards(bubble, linkCards);
      messagesBox.appendChild(bubble);
      if (scroll === 'bottom') messagesBox.scrollTop = messagesBox.scrollHeight;
      if (scroll === 'top') requestAnimationFrame(() => scrollMessageToTop(bubble));
      if (save) saveConversation();
      return bubble;
    };

    const showTyping = () => {
      hideTyping();
      typingBubble = document.createElement('div');
      typingBubble.className = 'chat-message chat-message--assistant chat-message--typing';
      typingBubble.setAttribute('aria-label', 'Assistent schreibt');
      typingBubble.innerHTML = '<span class="chat-message-label">Assistent</span><div class="chat-typing-dots" aria-hidden="true"><span></span><span></span><span></span></div>';
      messagesBox.appendChild(typingBubble);
    };

    const hideTyping = () => {
      if (typingBubble) {
        typingBubble.remove();
        typingBubble = null;
      }
    };

    const buildContactText = () => {
      const userMessages = conversation
        .filter((message) => message.role === 'user')
        .map((message) => message.content)
        .filter(Boolean)
        .slice(-4);
      const assistantMessages = conversation
        .filter((message) => message.role === 'assistant' && message.content !== greeting)
        .map((message) => message.content)
        .filter(Boolean)
        .slice(-2);
      const parts = [];
      if (userMessages.length) parts.push(`Meine Fragen / mein beschriebener Ablauf:\n${userMessages.join('\n\n')}`);
      if (assistantMessages.length) parts.push(`Kurze Einordnung aus dem KI-Assistenten:\n${assistantMessages.join('\n\n')}`);
      return parts.join('\n\n').slice(0, 1200);
    };

    const updateContactHref = () => {
      const transferText = buildContactText();
      if (contactLink) contactLink.href = 'kontakt.html#kontaktformular';
      if (!transferLink) return;
      if (transferText) {
        const params = new URLSearchParams();
        params.set('chat', transferText);
        transferLink.href = `kontakt.html?${params.toString()}#kontaktformular`;
        transferLink.removeAttribute('aria-disabled');
        transferLink.classList.remove('is-disabled');
      } else {
        transferLink.href = 'kontakt.html#kontaktformular';
        transferLink.setAttribute('aria-disabled', 'true');
        transferLink.classList.add('is-disabled');
      }
    };

    const closeAssistantFromLink = (target, event = null) => {
      const link = target instanceof Element ? target.closest('a') : null;
      if (!link) return;
      if (!root.contains(link) || link.hasAttribute('data-chat-toggle') || link.hasAttribute('data-chat-close')) return;
      if (link.getAttribute('aria-disabled') === 'true') {
        if (event) event.preventDefault();
        return;
      }
      setOpen(false);
    };

    const renderConversation = () => {
      messagesBox.innerHTML = '';
      conversation.forEach((message) => addMessage(message.role, message.content, { save: false, links: message.links, scroll: 'none' }));
      messagesBox.scrollTop = messagesBox.scrollHeight;
      updateContactHref();
    };

    const sendMessage = async (text) => {
      const userText = String(text || '').trim();
      if (userText.length < 2 || isSending) return;
      isSending = true;
      input.value = '';
      input.style.height = '';
      sendButton.disabled = true;
      sendButton.classList.add('is-disabled');
      setStatus('Assistent denkt nach ...', 'loading');
      conversation.push({ role: 'user', content: userText, links: [] });
      const userBubble = addMessage('user', userText, { scroll: 'top' });
      updateContactHref();
      showTyping();
      requestAnimationFrame(() => scrollMessageToTop(userBubble));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            messages: conversation.slice(-8).map((message) => ({ role: message.role, content: message.content })),
            page: {
              title: document.title,
              path: window.location.pathname,
              hash: window.location.hash
            }
          })
        });
        const result = await response.json().catch(() => ({}));
        const reply = result.reply || result.message || 'Der Assistent konnte gerade keine Antwort erstellen. Bitte nutze alternativ das Kontaktformular.';
        const links = uniqueLinks(result.links || extractLinksFromText(reply));
        hideTyping();
        const assistantMessage = { role: 'assistant', content: stripLinkReferences(reply), links };
        conversation.push(assistantMessage);
        addMessage('assistant', assistantMessage.content, { links, scroll: 'none' });
        requestAnimationFrame(() => scrollMessageToTop(userBubble, 'auto'));
        setStatus(result.limited ? 'Bei konkreten Abläufen hilft das Kontaktformular weiter.' : 'Du kannst jederzeit nachfragen.', result.limited ? 'limited' : 'ready');
      } catch (error) {
        const fallback = 'Der Assistent ist gerade nicht erreichbar. Bitte nutze alternativ das Kontaktformular.';
        const fallbackLinks = uniqueLinks(['kontakt.html#kontaktformular']);
        hideTyping();
        conversation.push({ role: 'assistant', content: fallback, links: fallbackLinks });
        addMessage('assistant', fallback, { links: fallbackLinks, scroll: 'none' });
        requestAnimationFrame(() => scrollMessageToTop(userBubble, 'auto'));
        setStatus('Verbindung fehlgeschlagen.', 'error');
      } finally {
        isSending = false;
        sendButton.disabled = false;
        sendButton.classList.remove('is-disabled');
        updateContactHref();
        saveConversation();
      }
    };

    conversation = loadConversation();
    if (!conversation.length) {
      conversation = [{ role: 'assistant', content: greeting, links: [] }];
      saveConversation();
    }
    renderConversation();
    setOpen(loadOpenState(), { persist: false });

    toggleButton.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
    closeButton.addEventListener('click', () => setOpen(false));
    panel.addEventListener('click', (event) => {
      closeAssistantFromLink(event.target, event);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(input.value);
    });
  };

  initChatAssistant();

  const focusHashTarget = (hash = window.location.hash, behavior = 'smooth') => {
    if (!hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    let target = null;
    try {
      target = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
    } catch (error) {
      target = document.getElementById(id);
    }
    if (!target) return;
    const topbar = document.querySelector('.topbar');
    const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
    const targetRect = target.getBoundingClientRect();
    const targetTop = window.scrollY + targetRect.top;
    const viewportSpace = Math.max(0, window.innerHeight - topbarHeight);
    const centeredTop = targetTop - topbarHeight - Math.max(18, (viewportSpace - Math.min(targetRect.height, viewportSpace * .72)) / 2);
    window.scrollTo({ top: Math.max(0, centeredTop), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior });
    target.classList.add('anchor-focus-highlight');
    window.setTimeout(() => target.classList.remove('anchor-focus-highlight'), 2200);
  };

  window.addEventListener('load', () => window.setTimeout(() => focusHashTarget(window.location.hash, 'auto'), 90));
  window.addEventListener('hashchange', () => window.setTimeout(() => focusHashTarget(window.location.hash, 'smooth'), 30));
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-chat-smart-link]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    const samePage = url.pathname === window.location.pathname;
    if (!samePage || !url.hash) return;
    event.preventDefault();
    if (window.location.hash !== url.hash) history.pushState(null, '', url.hash);
    focusHashTarget(url.hash, 'smooth');
  });


  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth > 1024) {
    document.querySelectorAll('.card,.workflow-node,.problem-card,.service-card,.usage-card,.contact-card,.contact-form,.example-card,.timeline-card,.step-card,.dashboard-shell,.overview-card,.workflow-current,.cta-panel,.quote-box').forEach((el) => {
      el.classList.add('tilt-ready');
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        el.style.setProperty('--mx', `${Math.round(px * 100)}%`);
        el.style.setProperty('--my', `${Math.round(py * 100)}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
      });
    });
  }

  requestAnimationFrame(() => body.classList.add('is-loaded'));
})();
