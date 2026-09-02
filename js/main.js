/* Seven Keys School · Landing interactions & motion
   Vanilla ES6, sin dependencias. Todo respeta prefers-reduced-motion. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- Navegación ---------- */
  function initNav() {
    const nav = $('#site-nav');
    const toggle = $('#nav-toggle');
    const menu = $('#mobile-menu');
    if (!nav) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!toggle || !menu) return;
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add('is-open'));
        nav.classList.add('is-scrolled');
        document.body.classList.add('menu-open');
        const first = $('a', menu);
        first && setTimeout(() => first.focus({ preventScroll: true }), 350);
      } else {
        menu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
        setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 600);
        onScroll();
      }
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    // Focus trap básico dentro del menú
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = $$('a, button', menu);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); toggle.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.focus(); }
    });
    window.matchMedia('(min-width: 64em)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Sección activa en el nav ---------- */
  function initActiveSection() {
    const links = $$('.nav-link[data-section]');
    if (!links.length || !hasIO) return;
    const map = new Map(links.map((l) => [l.dataset.section, l]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        const link = map.get(en.target.id);
        link && link.classList.add('is-active');
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    map.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---------- Barra de progreso ---------- */
  function initScrollProgress() {
    const bar = $('.scroll-progress');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Reveal on scroll + líneas SVG ---------- */
  function initReveal() {
    const items = $$('.reveal, .draw-on-view');
    if (!items.length) return;
    if (!hasIO || reduceMotion) { items.forEach((el) => el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    // Lo que ya asoma en la primera pantalla se muestra de inmediato (aunque quede cortado por el borde inferior).
    const vh = window.innerHeight;
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) { el.classList.add('is-visible'); return; }
      io.observe(el);
    });
  }

  /* ---------- H1 palabra por palabra ---------- */
  function initSplitWords() {
    const el = $('.split-words');
    if (!el || reduceMotion) return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    const counters = $$('.count');
    if (!counters.length) return;
    const run = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const from = parseInt(el.dataset.from, 10) || 0;
      if (reduceMotion) { el.textContent = target; return; }
      const dur = from ? 2000 : 1400, start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!hasIO) { counters.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------- Parallax suave del hero (mouse) ---------- */
  function initParallax() {
    const hero = $('.hero');
    const layers = $$('[data-parallax]');
    if (!hero || !layers.length || !finePointer || reduceMotion) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const tick = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      layers.forEach((l) => {
        const depth = parseFloat(l.dataset.parallax) || 10;
        l.style.transform = `translate3d(${(cx * depth).toFixed(2)}px, ${(cy * depth).toFixed(2)}px, 0)`;
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick); else raf = null;
    };
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  /* ---------- Montaje del logo en el hero ---------- */
  function initLogoAssembly() {
    const stage = $('#logo-stage');
    if (!stage) return;
    if (reduceMotion) { stage.classList.add('is-assembled'); return; }
    let lock = false;
    const assemble = () => {
      if (lock) return;
      lock = true;
      stage.classList.remove('is-assembled');
      void stage.offsetWidth; // reinicia las animaciones
      stage.classList.add('is-assembled');
      setTimeout(() => { lock = false; }, 3400);
    };
    const imgs = $$('img.part', stage);
    const loaded = Promise.all(imgs.map((im) => im.complete ? Promise.resolve() : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })));
    Promise.race([loaded, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(assemble));
    if (finePointer) stage.addEventListener('pointerenter', assemble);
    stage.addEventListener('click', assemble);
  }

  /* ---------- Brillo que sigue al cursor en tarjetas ---------- */
  function initCardGlow() {
    if (!finePointer) return;
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    }, { passive: true });
  }

  /* ---------- Marquee infinito ---------- */
  function initMarquee() {
    const track = $('.marquee-track');
    if (!track) return;
    track.append(...Array.from(track.children).map((n) => n.cloneNode(true)));
  }

  /* ---------- Facades de YouTube ---------- */
  function initVideoFacades() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.video-facade[data-yt]');
      if (!btn) return;
      const id = btn.dataset.yt;
      const title = (btn.getAttribute('aria-label') || '').replace(/^Reproducir:\s*/, '') || 'Video';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      const holder = document.createElement('div');
      holder.className = 'video-facade is-playing';
      holder.appendChild(iframe);
      btn.replaceWith(holder);
    });
  }

  /* ---------- Filtros con animación FLIP ---------- */
  function initFilters() {
    const grid = $('#video-grid');
    const chips = $$('.chip-btn[data-filter]');
    if (!grid || !chips.length) return;
    const cards = $$('.video-card', grid);
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
      const before = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
      cards.forEach((c) => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.kind !== f));
      if (reduceMotion || !('animate' in Element.prototype)) return;
      cards.forEach((c) => {
        if (c.classList.contains('is-hidden')) return;
        const a = before.get(c), b = c.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        const wasHidden = a.width === 0;
        c.animate(
          wasHidden
            ? [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }]
            : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' }
        );
      });
    }));
  }

  /* ---------- Carrusel de testimonios ---------- */
  function initCarousel() {
    const track = $('#carousel-track');
    const cards = $$('.t-card', track || document);
    const prev = $('#c-prev'), next = $('#c-next'), dots = $('#c-dots');
    if (!track || !cards.length) return;
    let current = 0, timer = null, paused = false;

    const dotEls = cards.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', `Testimonio ${i + 1} de ${cards.length}`);
      b.addEventListener('click', () => goTo(i, true));
      dots && dots.appendChild(b);
      return b;
    });

    const setCurrent = (i) => {
      current = i;
      cards.forEach((c, k) => c.classList.toggle('is-current', k === i));
      dotEls.forEach((d, k) => { d.classList.toggle('is-active', k === i); d.setAttribute('aria-selected', String(k === i)); });
    };
    const goTo = (i, user) => {
      const idx = (i + cards.length) % cards.length;
      const card = cards[idx];
      const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      track.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      setCurrent(idx);
      if (user) restart();
    };
    prev && prev.addEventListener('click', () => goTo(current - 1, true));
    next && next.addEventListener('click', () => goTo(current + 1, true));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1, true); }
    });

    // Sincronizar el punto activo con el scroll manual/swipe
    if (hasIO) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting && en.intersectionRatio >= 0.6) setCurrent(cards.indexOf(en.target)); });
      }, { root: track, threshold: [0.6] });
      cards.forEach((c) => io.observe(c));
    }

    // Autoplay con pausas
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (reduceMotion || paused || timer) return; timer = setInterval(() => goTo(current + 1), 7000); };
    const restart = () => { stop(); start(); };
    ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach((ev) => track.addEventListener(ev, () => { paused = true; stop(); }, { passive: true }));
    ['mouseleave', 'focusout'].forEach((ev) => track.addEventListener(ev, () => { paused = false; start(); }));
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    setCurrent(0);
    start();
  }

  /* ---------- Leer más en testimonios ---------- */
  function initReadMore() {
    $$('.t-card').forEach((card) => {
      const text = $('.t-text', card), btn = $('.read-more', card);
      if (!text || !btn) return;
      const check = () => { if (!text.classList.contains('clamp')) return; btn.hidden = text.scrollHeight <= text.clientHeight + 2; };
      check();
      window.addEventListener('resize', check, { passive: true });
      btn.addEventListener('click', () => {
        const expanded = text.classList.toggle('clamp') === false;
        btn.textContent = expanded ? 'Leer menos' : 'Leer más';
        btn.setAttribute('aria-expanded', String(expanded));
      });
    });
  }

  /* ---------- Lightbox (dialog) ---------- */
  function initLightbox() {
    const dlg = $('#lightbox'), img = $('#lightbox-img'), close = $('#lightbox-close');
    if (!dlg || !img || typeof dlg.showModal !== 'function') return;
    $$('.zoomable[data-full]').forEach((b) => b.addEventListener('click', () => {
      img.src = b.dataset.full;
      img.alt = ($('img', b) || {}).alt || 'Imagen ampliada';
      dlg.showModal();
    }));
    close && close.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { img.src = ''; });
  }

  /* ---------- Facade de Instagram ---------- */
  function initInstagramFacade() {
    const box = $('#ig-facade'), btn = $('#ig-load');
    if (!box || !btn) return;
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.instagram.com/sevenkeyschool/embed';
      iframe.title = 'Instagram de Seven Keys School';
      iframe.loading = 'lazy';
      iframe.setAttribute('scrolling', 'no');
      box.classList.add('is-loaded');
      box.replaceChildren(iframe);
    });
  }

  /* ---------- FAB WhatsApp ---------- */
  function initFab() {
    const fab = $('#fab-chat'), hero = $('.hero');
    if (!fab) return;
    if (!hero || !hasIO) { fab.classList.add('is-visible'); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((en) => fab.classList.toggle('is-visible', !en.isIntersecting));
    }, { threshold: 0.2 }).observe(hero);
  }

  /* ---------- Asistente de chat (Cloudflare Worker + Gemini) ---------- */
  // Reemplaza esta URL por la de tu Worker una vez lo despliegues, p. ej.:
  // "https://sevenkeys-assistant.tu-subdominio.workers.dev"
  const CHAT_WORKER_URL = 'REEMPLAZA_CON_TU_URL_DE_WORKER';

  function initChatAssistant() {
    const widget = $('#chat-widget');
    const fab = $('#fab-chat');
    const panel = $('#chat-panel');
    const closeBtn = $('#chat-close');
    const body = $('#chat-body');
    const form = $('#chat-form');
    const input = $('#chat-input');
    const handoffBox = $('#chat-handoff');
    if (!widget || !fab || !panel || !form || !input) return;

    const history = [];
    let sending = false;

    function openPanel() {
      widget.classList.add('is-open');
      fab.setAttribute('aria-expanded', 'true');
      setTimeout(() => input.focus(), 200);
    }
    function closePanel() {
      widget.classList.remove('is-open');
      fab.setAttribute('aria-expanded', 'false');
    }
    fab.addEventListener('click', () => {
      widget.classList.contains('is-open') ? closePanel() : openPanel();
    });
    closeBtn?.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && widget.classList.contains('is-open')) closePanel();
    });
    document.addEventListener('click', (e) => {
      if (widget.classList.contains('is-open') && !widget.contains(e.target)) closePanel();
    });

    function addMessage(text, role) {
      const div = document.createElement('div');
      div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg-user' : 'chat-msg-bot');
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    function addTyping() {
      const div = document.createElement('div');
      div.className = 'chat-msg-typing';
      div.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    async function sendMessage(text) {
      if (sending) return;
      sending = true;
      addMessage(text, 'user');
      history.push({ role: 'user', content: text });
      const typing = addTyping();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      if (!CHAT_WORKER_URL || CHAT_WORKER_URL.startsWith('REEMPLAZA')) {
        typing.remove();
        addMessage('El asistente todavía no está configurado. Escríbenos directo por WhatsApp.', 'bot');
        handoffBox?.removeAttribute('hidden');
        sending = false;
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      try {
        const res = await fetch(CHAT_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json();
        typing.remove();
        addMessage(data.reply || 'No pude procesar tu mensaje, intenta de nuevo.', 'bot');
        history.push({ role: 'assistant', content: data.reply || '' });
        if (data.handoff) handoffBox?.removeAttribute('hidden');
      } catch (err) {
        typing.remove();
        addMessage('Tuvimos un problema de conexión. ¿Prefieres escribirnos por WhatsApp?', 'bot');
        handoffBox?.removeAttribute('hidden');
      } finally {
        sending = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendMessage(text);
    });
  }

  /* ---------- Año del footer ---------- */
  function initFooterYear() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  const init = () => {
    initNav(); initActiveSection(); initScrollProgress(); initSplitWords(); initReveal(); initCounters();
    initParallax(); initLogoAssembly(); initCardGlow(); initMarquee(); initVideoFacades(); initFilters(); initCarousel();
    initReadMore(); initLightbox(); initInstagramFacade(); initFab(); initChatAssistant(); initFooterYear();
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
