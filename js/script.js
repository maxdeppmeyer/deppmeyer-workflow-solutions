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


  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scrollAnimationFrame = 0;
  let scrollAnimationToken = 0;

  const getHeaderOffset = () => {
    const topbarHeight = topbar?.getBoundingClientRect().height || 0;
    return Math.max(Math.round(topbarHeight + 18), 88);
  };

  const stopSmoothScroll = () => {
    if (scrollAnimationFrame) {
      window.cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = 0;
    }
    scrollAnimationToken += 1;
  };

  const animateWindowScroll = (targetTop, duration = 620) => {
    const safeTargetTop = Math.max(Math.round(targetTop), 0);
    const startTop = window.scrollY || window.pageYOffset || 0;
    const delta = safeTargetTop - startTop;
    if (Math.abs(delta) < 4) return;
    if (prefersReducedMotion()) {
      stopSmoothScroll();
      window.scrollTo(0, safeTargetTop);
      return;
    }
    stopSmoothScroll();
    const token = scrollAnimationToken;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      if (token !== scrollAnimationToken) return;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, startTop + delta * eased);
      if (progress < 1) {
        scrollAnimationFrame = window.requestAnimationFrame(step);
      } else {
        scrollAnimationFrame = 0;
      }
    };
    scrollAnimationFrame = window.requestAnimationFrame(step);
  };

  const queueViewportFocus = (() => {
    let pendingTimer = 0;
    let pendingFrameA = 0;
    let pendingFrameB = 0;

    const clearPending = () => {
      if (pendingTimer) {
        window.clearTimeout(pendingTimer);
        pendingTimer = 0;
      }
      if (pendingFrameA) {
        window.cancelAnimationFrame(pendingFrameA);
        pendingFrameA = 0;
      }
      if (pendingFrameB) {
        window.cancelAnimationFrame(pendingFrameB);
        pendingFrameB = 0;
      }
    };

    return (target, options = {}) => {
      if (!target) return;
      clearPending();
      const {
        align = 'start',
        duration = 620,
        delay = 0,
        tolerance = 22,
        force = false,
        mobileAlign = 'start',
        desktopAlign = align,
      } = options;

      const runFocus = () => {
        pendingFrameA = window.requestAnimationFrame(() => {
          pendingFrameA = 0;
          pendingFrameB = window.requestAnimationFrame(() => {
            pendingFrameB = 0;
            if (!target.isConnected) return;
            const isMobile = window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches;
            const activeAlign = isMobile ? mobileAlign : desktopAlign;
            const rect = target.getBoundingClientRect();
            const headerOffset = getHeaderOffset();
            const viewportHeight = window.innerHeight;
            const currentTop = window.scrollY || window.pageYOffset || 0;
            const comfortTop = headerOffset + 16;
            const comfortBottom = viewportHeight - 24;
            let desiredTop = currentTop;

            if (activeAlign === 'center') {
              const usableHeight = Math.max(viewportHeight - headerOffset - 32, 260);
              const targetCenter = rect.top + currentTop + rect.height / 2;
              desiredTop = targetCenter - (headerOffset + usableHeight / 2);
            } else {
              desiredTop = rect.top + currentTop - headerOffset - 14;
            }

            const outOfViewTop = rect.top < comfortTop - tolerance;
            const outOfViewBottom = rect.bottom > comfortBottom + tolerance;
            const centerDelta = Math.abs((rect.top + rect.height / 2) - (headerOffset + (viewportHeight - headerOffset) / 2));
            const shouldScroll = force || (activeAlign === 'center' ? centerDelta > 72 || outOfViewTop || outOfViewBottom : outOfViewTop || outOfViewBottom);
            if (!shouldScroll) return;
            animateWindowScroll(desiredTop, duration);
          });
        });
      };

      const effectiveDelay = Math.min(Math.max(Number(delay) || 0, 0), 18);
      if (effectiveDelay > 0) {
        pendingTimer = window.setTimeout(() => {
          pendingTimer = 0;
          runFocus();
        }, effectiveDelay);
        return;
      }
      runFocus();
    };
  })();

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
      if (open) queueViewportFocus(item, { desktopAlign: 'center', mobileAlign: 'start', duration: 500, delay: 0, tolerance: 18 });
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
        queueViewportFocus(explorer, { desktopAlign: 'center', mobileAlign: 'start', duration: 520, delay: 0, force: true });
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
      if (details.open) {
        queueViewportFocus(details, { desktopAlign: 'center', mobileAlign: 'start', duration: 520, delay: 0, tolerance: 16 });
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
      if (trigger) trigger.textContent = 'Workflow starten';
    };

    const isExampleDashboard = document.body?.getAttribute('data-page') === 'beispiele.html' && root.classList.contains('example-dashboard');

    const maybeAutoScrollStep = (stepIndex, options = {}) => {
      if (!isExampleDashboard) return;
      const isLastStep = stepIndex >= config.steps.length - 1;
      const activeNode = nodes[Math.min(stepIndex, nodes.length - 1)];
      const target = isLastStep ? (currentBox || activeNode || root) : (activeNode || currentBox || root);
      queueViewportFocus(target, {
        desktopAlign: 'center',
        mobileAlign: 'center',
        duration: window.matchMedia('(max-width: 900px)').matches ? 560 : 460,
        delay: options.delay ?? 0,
        tolerance: window.matchMedia('(max-width: 900px)').matches ? 34 : 22,
        force: Boolean(options.force),
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
        if (trigger) trigger.textContent = 'Erneut starten';
        clearTimer();
        return;
      }
      const mobileDelay = window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches ? 2050 : 1450;
      timer = setTimeout(() => runStep(stepIndex + 1), mobileDelay);
    };

    const run = () => {
      clearTimer();
      nodes.forEach((node) => node.classList.remove('active', 'done'));
      if (trigger) trigger.textContent = 'Workflow läuft …';
      if (isExampleDashboard) {
        const startTarget = root.closest('[data-example-card]') || root;
        queueViewportFocus(startTarget, {
          desktopAlign: 'center',
          mobileAlign: 'center',
          duration: window.matchMedia('(max-width: 900px)').matches ? 560 : 460,
          delay: 0,
          force: true,
        });
      }
      runStep(0);
    };

    if (trigger) trigger.addEventListener('click', run);
    reset();
  };
  document.querySelectorAll('[data-workflow]').forEach(initWorkflow);

  const searchItems = [
    { title: 'KMU-Fokus', text: 'Workflow-Lösungen vor allem für kleine und mittelständische Unternehmen mit wiederkehrenden Abläufen.', url: 'index.html#hero' },
    { title: 'Workflows entwickeln und betreuen', text: 'Ich entwickle und betreue Workflows, die Unternehmen bei wiederkehrenden Prozessen spürbar entlasten.', url: 'index.html#hero' },
    { title: 'Automatische Kundenantworten', text: 'Standardanfragen erkennen, passende Erstantworten vorbereiten und schneller reagieren.', url: 'beispiele.html#beispiel-autoantwort' },
    { title: 'Automatische Terminbuchung', text: 'Terminwünsche übernehmen, Kalender prüfen, bestätigen und erinnern.', url: 'beispiele.html#beispiel-terminbuchung' },
    { title: 'Angebotsvorbereitung', text: 'Angaben aus E-Mails, Formularen oder Dokumenten für Angebote strukturieren.', url: 'beispiele.html#beispiel-angebotsvorbereitung' },
    { title: 'Leistungsüberblick', text: 'Analyse, Beratung, Planung und Umsetzung, Übergabe und Optimierung sowie Betreuung.', url: 'leistungen.html#leistungen-ueberblick' },
    { title: 'Praxisbeispiele', text: 'Zwanzig praxisnahe Beispiele zu E-Mail, Terminen, Dokumenten, Support und internen Abläufen.', url: 'beispiele.html' },
    { title: 'Einsatzbereiche', text: 'Wo Workflow-Lösungen bei E-Mail-Prozessen, Terminabläufen, Dokumenten und Übergaben helfen.', url: 'einsatzbereiche.html' },
    { title: 'Kontaktformular', text: 'Kurzes Formular mit Name, Unternehmen, E-Mail, Thema und Beschreibung.', url: 'kontakt.html#kontaktformular' },
    { title: 'FAQ', text: 'Häufige Fragen zu Zusammenarbeit, Technik, Terminen, Dokumenten, KI und Betreuung.', url: 'index.html#faq' },
    { title: 'FAQ-Thema Zusammenarbeit', text: 'Weitere Fragen zu Ablauf, Kommunikation und sinnvollem Projektstart.', url: 'index.html#faq' },
    { title: 'FAQ-Thema Technik & Tools', text: 'Fragen zu vorhandenen Tools, Integrationen und technischer Umsetzung.', url: 'index.html#faq' },
    { title: 'Postfach-Automatisierung', text: 'Postfächer automatisch überwachen, Anfragen erkennen, sortieren und mit Antwort- oder Weiterleitungslogik verbinden.', url: 'beispiele.html#beispiel-autoantwort', keywords: 'postfach inbox posteingang mail eingang sortierung erstantwort autoantwort' },
    { title: 'Schnellcheck Workflow', text: 'Zehn Fragen zeigen, welcher Workflow zuerst den größten Nutzen bringt.', url: 'index.html#workflow-check', keywords: 'fragebogen schnellcheck workflow check analyse orientierung' },
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
      dokumente: ['dokument','dokumente','datei','dateien','angebot','angebote','rechnung','ablage','anhang'],
      support: ['support','service','ticket','reklamation','hilfe'],
      intern: ['intern','weiterleitung','zustaendigkeit','status','uebergabe'],
      faq: ['faq','fragen','hilfe','info'],
      workflow: ['workflow','automatisierung','prozess','prozesse','ablauf','ablaeufe']
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
    if (!window.siteConfig || !window.siteConfig[key]) return;
    node.textContent = window.siteConfig[key];
    if (node.tagName === 'A') {
      if (key === 'email') node.href = `mailto:${window.siteConfig[key]}`;
      if (key === 'phone') node.href = `tel:${window.siteConfig[key].replace(/\s+/g, '')}`;
    }
  });


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
        examples: 'beispiele.html#beispiel-autoantwort'
      },
      termine: {
        title: 'Besonders sinnvoll: Automatische Terminbuchung und Rückmeldelogik',
        copy: 'Ihre Antworten passen besonders gut zu einem Ablauf, der Terminwünsche übernimmt, freie Zeiten prüft und Bestätigungen oder Erinnerungen automatisch vorbereitet. So wird aus einem zeitaufwendigen Hin und Her ein verlässlicher Prozess.',
        bullets: ['Typisch sinnvoll bei Beratungs-, Service- oder Vor-Ort-Terminen.', 'Möglich sind Terminabgleich, Bestätigung, Erinnerungen und saubere Dokumentation.', 'Gerade bei wiederkehrenden Terminprozessen lassen sich viele Minuten pro Vorgang sparen.'],
        topic: 'Automatische Terminbuchung',
        examples: 'beispiele.html#beispiel-terminbuchung'
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
        examples: 'beispiele.html#beispiel-intern'
      },
      mix: {
        title: 'Besonders sinnvoll: Mit einem kleinen Kern-Workflow starten',
        copy: 'Ihre Antworten zeigen, dass nicht nur ein einzelner Schritt Zeit kostet, sondern mehrere kleine Abläufe zusammenspielen. In solchen Fällen ist meist ein Start mit dem größten Engpass am sinnvollsten, damit Entlastung schnell spürbar wird und später sinnvoll erweitert werden kann.',
        bullets: ['Typisch sinnvoll, wenn E-Mails, Termine, Dokumente und Übergaben gleichzeitig eine Rolle spielen.', 'Empfohlen wird ein schlanker Start mit dem größten Zeitfresser und einer sinnvollen Ausbauperspektive.', 'So entsteht keine unnötig große Lösung, sondern ein Schritt, der im Alltag sofort hilft.'],
        topic: 'Allgemeine Prozessoptimierung',
        examples: 'beispiele.html#beispiel-multichannel'
      }
    };

    const categoryScores = ['email','termine','dokumente','intern','mix'];

    const updateStep = (index = 0, options = {}) => {
      currentStep = Math.max(0, Math.min(index, fieldsets.length - 1));
      fieldsets.forEach((field, fieldIndex) => { field.hidden = fieldIndex !== currentStep; });
      if (progress) progress.textContent = `Frage ${currentStep + 1} von ${fieldsets.length}`;
      if (prevButton) prevButton.hidden = currentStep === 0;
      if (nextButton) nextButton.hidden = true;
      if (evaluateButton) evaluateButton.hidden = true;
      if (resultBox && !options.keepResult) resultBox.hidden = true;
      if (options.scroll !== false) {
        const target = fieldsets[currentStep];
        if (target) {
          if (options.instant || prefersReducedMotion()) {
            target.scrollIntoView({ behavior: 'auto', block: 'nearest' });
          } else {
            queueViewportFocus(target, { desktopAlign: 'center', mobileAlign: 'start', duration: 460, delay: 0, tolerance: 14 });
          }
        }
      }
    };

    const openCheck = () => {
      shell.hidden = false;
      toggle.textContent = toggleCloseLabel;
      updateStep(0, { instant: true });
      if (isMobile()) queueViewportFocus(shell, { desktopAlign: 'start', mobileAlign: 'start', duration: 480, delay: 0, force: true });
    };
    const closeCheck = () => {
      shell.hidden = true;
      toggle.textContent = toggleOpenLabel;
      if (resultBox) resultBox.hidden = true;
    };
    toggle.addEventListener('click', () => shell.hidden ? openCheck() : closeCheck());

    const currentFieldAnswered = () => {
      const field = fieldsets[currentStep];
      if (!field) return true;
      const name = field.querySelector('input[type="radio"]')?.name;
      return name ? Boolean(form.querySelector(`input[name="${name}"]:checked`)) : true;
    };

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
      resultTitle.textContent = result.title;
      resultCopy.textContent = result.copy;
      resultBullets.innerHTML = result.bullets.map((entry) => `<li>${entry}</li>`).join('');
      if (contactLink) {
        const params = new URLSearchParams({ assessment: result.title, summary: result.copy, topic: result.topic });
        contactLink.href = `kontakt.html?${params.toString()}#kontaktformular`;
      }
      if (exampleLink) exampleLink.href = result.examples;
      resultBox.hidden = false;
      queueViewportFocus(resultBox, { desktopAlign: 'center', mobileAlign: 'start', duration: 520, delay: 0, force: true });
    };

    evaluateButton?.addEventListener('click', evaluate);
    applyButton?.addEventListener('click', () => {
      if (!currentResult) return;
      shell.dispatchEvent(new CustomEvent('workflowcheck:apply', { bubbles: true, detail: currentResult }));
      currentResult = null;
      form.reset();
      closeCheck();
    });
    discardButton?.addEventListener('click', () => {
      currentResult = null;
      form.reset();
      closeCheck();
    });
    form.addEventListener('change', (event) => {
      currentResult = null;
      if (resultBox && !resultBox.hidden) resultBox.hidden = true;
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
      const field = target.closest('fieldset');
      const fieldIndex = fieldsets.indexOf(field);
      if (fieldIndex === -1) return;
      currentStep = fieldIndex;
      if (!currentFieldAnswered()) return;
      if (currentStep >= fieldsets.length - 1) {
        evaluate();
        return;
      }
      window.setTimeout(() => {
        if (fieldsets[currentStep] === field) updateStep(currentStep + 1);
      }, 90);
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
    const responseNote = contactForm.querySelector('[data-contact-note]');
    const defaultResponseNote = responseNote ? responseNote.textContent.trim() : '';
    const emailInput = contactForm.querySelector('#email');
    const emailFeedback = contactForm.querySelector('[data-email-feedback]');
    const consentInput = contactForm.querySelector('#consent');
    const consentFeedback = contactForm.querySelector('[data-consent-feedback]');
    const prefillBox = contactForm.querySelector('[data-contact-prefill]');
    const prefillText = contactForm.querySelector('[data-contact-prefill-text]');
    const prefillClearButton = contactForm.querySelector('[data-contact-prefill-clear]');
    const messageField = contactForm.querySelector('#message');
    const topicField = contactForm.querySelector('#topic');
    const requiredControls = [...contactForm.querySelectorAll('[required]')];
    let isSubmitting = false;

    const setResponseNote = (message, state = 'default') => {
      if (!responseNote) return;
      responseNote.textContent = message || defaultResponseNote;
      responseNote.classList.toggle('is-error', state === 'error');
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
      return text ? `Schnellcheck-Ergebnis: ${text}` : '';
    };

    const getLabelText = (control) => {
      if (control === consentInput) return 'Einwilligung zur Datenverarbeitung';
      const label = control.id ? contactForm.querySelector(`label[for="${control.id}"]`) : null;
      return label
        ? label.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim().replace(/:$/, '')
        : 'Pflichtfeld';
    };

    const getMarkerHost = (control) => {
      if (control === consentInput) return control.closest('.consent-wrap');
      return control.id ? contactForm.querySelector(`label[for="${control.id}"]`) : null;
    };

    const getFieldWrap = (control) => {
      if (control === consentInput) return control.closest('.consent-wrap');
      return control.parentElement;
    };

    const isFilled = (control) => {
      if (!control) return false;
      if (control.type === 'checkbox') return control.checked;
      return String(control.value || '').trim() !== '';
    };

    const getControlState = (control) => {
      if (control === emailInput) {
        const emailState = validateEmailValue(control.value);
        return {
          filled: isFilled(control),
          valid: emailState.valid,
          message: !isFilled(control)
            ? 'Bitte E-Mail ausfüllen.'
            : 'Bitte E-Mail korrekt ausfüllen.'
        };
      }
      if (control === consentInput) {
        return {
          filled: control.checked,
          valid: control.checked,
          message: 'Bitte die Einwilligung zur Datenverarbeitung bestätigen.'
        };
      }
      if (control.tagName === 'SELECT') {
        return {
          filled: isFilled(control),
          valid: isFilled(control),
          message: `Bitte ${getLabelText(control)} auswählen.`
        };
      }
      return {
        filled: isFilled(control),
        valid: isFilled(control),
        message: `Bitte ${getLabelText(control)} ausfüllen.`
      };
    };

    const ensureRequiredMarkers = () => {
      requiredControls.forEach((control) => {
        const host = getMarkerHost(control);
        if (!host) return;
        host.classList.add('has-required-marker');
        if (host.querySelector('.required-marker')) return;
        const marker = document.createElement('span');
        marker.className = 'required-marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = '*';
        host.append(marker);
      });
    };

    const updateRequiredIndicators = () => {
      requiredControls.forEach((control) => {
        const state = getControlState(control);
        const host = getMarkerHost(control);
        const wrap = getFieldWrap(control);
        const marker = host ? host.querySelector('.required-marker') : null;

        if (marker) marker.hidden = state.filled;
        if (host) {
          host.classList.toggle('is-required-empty', !state.filled);
          host.classList.toggle('is-required-filled', state.filled);
        }
        if (wrap) {
          wrap.classList.toggle('is-required-empty', !state.filled);
          wrap.classList.toggle('is-required-filled', state.filled);
        }
      });
    };

    const getFirstInvalidRequiredControl = () => requiredControls.find((control) => !getControlState(control).valid) || null;

    function updateSummary() {
      const formData = new FormData(contactForm);
      const emailState = validateEmailValue(formData.get('email'));
      const consentGiven = Boolean(formData.get('consent'));
      const lines = [
        ['Name', formData.get('name') || '—'],
        ['Unternehmen', formData.get('company') || '—'],
        ['E-Mail', formData.get('email') || '—'],
        ['Thema', formData.get('topic') || '—'],
        ['Beschreibung', formData.get('message') || '—'],
        ['Schnellcheck', getAssessmentText() || '—'],
        ['Einwilligung', consentGiven ? 'Bestätigt' : 'Ausstehend']
      ];
      if (summary) {
        summary.innerHTML = lines.map(([label, value]) => `<div><strong>${label}:</strong> ${String(value).replace(/</g, '&lt;')}</div>`).join('');
      }
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
      updateRequiredIndicators();
      if (submitButton) {
        submitButton.disabled = isSubmitting;
        submitButton.setAttribute('aria-disabled', String(isSubmitting));
        submitButton.classList.toggle('is-disabled', isSubmitting);
      }
      if (!isSubmitting && !getFirstInvalidRequiredControl() && responseNote?.classList.contains('is-error')) {
        setResponseNote(defaultResponseNote);
      }
    }

    function setAssessmentPrefill({ title = '', summary = '', topic = '' } = {}) {
      const previousAutofill = String(contactForm.dataset.assessmentAutofillText || '');
      const nextTitle = String(title || '').trim();
      const nextSummary = String(summary || '').trim();
      const nextTopic = String(topic || '').trim();

      contactForm.dataset.assessmentTitle = nextTitle;
      contactForm.dataset.assessmentSummary = nextSummary;
      contactForm.dataset.assessmentTopic = nextTopic;

      const assessmentText = getAssessmentText();
      if (prefillBox && prefillText) {
        prefillBox.hidden = !assessmentText;
        prefillText.textContent = assessmentText ? `Übernommenes Schnellcheck-Ergebnis: ${assessmentText}` : '';
      }

      if (nextTopic) applyTopicChoice(nextTopic);

      const nextAutofill = getAssessmentMessage();
      if (messageField) {
        const messageTrimmed = messageField.value.trim();
        const canReplaceAutofill = Boolean(previousAutofill) && messageTrimmed === previousAutofill.trim();
        if (!messageTrimmed || canReplaceAutofill) {
          messageField.value = nextAutofill;
          contactForm.dataset.assessmentAutofillText = nextAutofill;
        } else if (!nextAutofill) {
          contactForm.dataset.assessmentAutofillText = '';
        }
      }

      updateSummary();
    }

    const clearAssessmentPrefill = () => setAssessmentPrefill({});

    const applyAssessmentPrefill = () => {
      const params = new URLSearchParams(window.location.search);
      const resultTitle = params.get('assessment');
      const resultSummary = params.get('summary');
      const resultTopic = params.get('topic');
      if (!resultTitle || !resultSummary) return;
      setAssessmentPrefill({ title: resultTitle, summary: resultSummary, topic: resultTopic });
    };

    document.addEventListener('workflowcheck:apply', (event) => {
      const detail = event.detail || {};
      if (!detail.title || !detail.summary) return;
      setAssessmentPrefill({ title: detail.title, summary: detail.summary, topic: detail.topic || '' });
      queueViewportFocus(contactForm, { desktopAlign: 'start', mobileAlign: 'start', duration: 520, delay: 0, force: true });
    });

    prefillClearButton?.addEventListener('click', () => {
      clearAssessmentPrefill();
      setResponseNote(defaultResponseNote);
    });

    ensureRequiredMarkers();
    applyAssessmentPrefill();

    contactForm.addEventListener('input', () => {
      if (!isSubmitting) updateSummary();
    });
    contactForm.addEventListener('change', () => {
      if (!isSubmitting) updateSummary();
    });
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      updateSummary();
      const firstInvalidControl = getFirstInvalidRequiredControl();
      if (firstInvalidControl) {
        setResponseNote(getControlState(firstInvalidControl).message, 'error');
        firstInvalidControl.focus();
        return;
      }
      if (isSubmitting) return;
      isSubmitting = true;
      if (submitButton) {
        submitButton.textContent = 'Wird gesendet...';
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
        submitButton.classList.add('is-disabled');
      }
      setResponseNote('Anfrage wird gesendet...');
      try {
        const formData = new FormData(contactForm);
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
            consent: Boolean(formData.get('consent')),
            assessment: getAssessmentText()
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.message || 'Die Anfrage konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.');
        }
        contactForm.reset();
        clearAssessmentPrefill();
        applyAssessmentPrefill();
        updateSummary();
        setResponseNote(result.message || 'Anfrage erfolgreich gesendet.');
      } catch (error) {
        setResponseNote(error && error.message ? error.message : 'Die Anfrage konnte gerade nicht gespeichert werden. Bitte versuchen Sie es erneut.', 'error');
      } finally {
        isSubmitting = false;
        if (submitButton) {
          submitButton.textContent = 'Anfrage absenden';
        }
        updateSummary();
      }
    });
    updateSummary();
  }


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
