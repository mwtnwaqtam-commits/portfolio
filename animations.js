/* ==========================================================
   Portfolio animations — vanilla JS, no dependencies
   ========================================================== */
(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- 1. Intro loader -> reveal hero ---------- */
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    document.body.classList.add('loaded');
    setTimeout(() => {
      document.body.classList.add('ready');
      runCounters();
      startTyping();
    }, reduce ? 0 : 650);
  };
  const minWait = new Promise(r => setTimeout(r, reduce ? 0 : 1250));
  const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  Promise.all([minWait, loaded]).then(start);
  setTimeout(start, 3500); // safety net

  /* ---------- 2. Scroll progress + header + scrollspy ---------- */
  const bar = $('.scroll-progress');
  const header = $('.site-header');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
      if (header) header.classList.toggle('scrolled', scrollY > 24);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  const links = $$('.nav-links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ---------- 3. Scroll reveal (with stagger) ---------- */
  // Split section titles into masked words
  $$('.section-heading h2').forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words
      .map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>`)
      .join(' ');
  });

  const revealGroups = [
    '.about-grid p',
    '.skill-grid article',
    '.project-card',
    '.timeline-item',
    '.certificate-card',
    '.contact-box',
    '.contact-links a',
  ];
  revealGroups.forEach(sel => {
    $$(sel).forEach(el => {
      const sibs = $$(sel).filter(x => x.parentElement === el.parentElement);
      const i = sibs.indexOf(el);
      el.classList.add('reveal');
      el.style.setProperty('--d', `${Math.min(i, 6) * 0.1}s`);
    });
  });
  $$('.skill-grid article .tags span').forEach((t, _i, all) => {
    const sibs = $$('span', t.parentElement);
    t.style.setProperty('--ti', sibs.indexOf(t));
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .section-heading').forEach(el => io.observe(el));

  /* ---------- 4. Animated counters ---------- */
  function runCounters() {
    $$('[data-count]').forEach(el => {
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      if (reduce) return;
      const dur = 2200;
      const t0 = performance.now();
      const ease = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
      const tick = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        const v = end * ease(p);
        el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 5. Typing effect ---------- */
  function startTyping() {
    const el = $('#typed');
    if (!el || reduce) return;
    const words = ['Data Analysis', 'Machine Learning', 'Web Scraping', 'Power BI Dashboards', 'Exploratory Data Analysis'];
    let w = 0, c = 0, del = false;
    el.textContent = '';
    const step = () => {
      const word = words[w];
      c += del ? -1 : 1;
      el.textContent = word.slice(0, c);
      let delay = del ? 35 : 75;
      if (!del && c === word.length) { del = true; delay = 1600; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(step, delay);
    };
    step();
  }

  /* ---------- 6. Particle network background ---------- */
  const cv = $('#bg-canvas');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, pts = [];
    const mouse = { x: -9999, y: -9999 };
    const LINK = 135;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(95, Math.floor((W * H) / 17000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
        r: Math.random() * 1.6 + .8,
        c: Math.random() < .7 ? '96,165,250' : '16,185,129',
      }));
    };
    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    const draw = (move) => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 150 * 150 && d2 > 1) { // gentle push away from cursor
            const d = Math.sqrt(d2), f = (150 - d) / 150 * .6;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgba(${p.c},.75)`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(96,165,250,${(1 - Math.sqrt(d2) / LINK) * .28})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const mx = p.x - mouse.x, my = p.y - mouse.y, md2 = mx * mx + my * my;
        if (md2 < 175 * 175) {
          ctx.strokeStyle = `rgba(16,185,129,${(1 - Math.sqrt(md2) / 175) * .5})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    };

    if (reduce) {
      draw(false);
    } else {
      let running = true;
      const loop = () => { if (running) { draw(true); requestAnimationFrame(loop); } };
      document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) loop();
      });
      loop();
    }
  }

  /* ---------- 7. Cursor glow, spotlight, tilt, magnetic, parallax ---------- */
  if (fine && !reduce) {
    // soft cursor light
    const glow = $('.cursor-glow');
    if (glow) {
      let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
      addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
      document.addEventListener('pointerleave', () => glow.classList.remove('on'));
      const follow = () => {
        gx += (tx - gx) * .12; gy += (ty - gy) * .12;
        glow.style.transform = `translate(${gx}px, ${gy}px)`;
        requestAnimationFrame(follow);
      };
      follow();
    }

    // spotlight (all cards) + 3D tilt (project & skill cards)
    const fxEls = $$('.project-card, .skill-grid article, .certificate-card');
    fxEls.forEach(el => el.classList.add('fx'));
    $$('.project-card, .skill-grid article').forEach(el => el.classList.add('tilt'));

    fxEls.forEach(el => {
      let raf = 0;
      const max = el.classList.contains('project-card') ? 5 : 6;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--mx', `${x * 100}%`);
          el.style.setProperty('--my', `${y * 100}%`);
          if (el.classList.contains('tilt')) {
            el.style.setProperty('--ry', `${(x - .5) * max * 2}deg`);
            el.style.setProperty('--rx', `${-(y - .5) * max * 2}deg`);
          }
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // magnetic buttons
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        b.style.transform = `translate(${x * .22}px, ${y * .3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });

    // hero parallax (portrait follows the mouse a little)
    const hero = $('.hero');
    const visual = $('.hero-visual');
    if (hero && visual) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        visual.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
        visual.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
      });
      hero.addEventListener('pointerleave', () => {
        visual.style.setProperty('--px', 0);
        visual.style.setProperty('--py', 0);
      });
    }
  }

  /* ---------- 8. Mobile menu: close on link click ---------- */
  const nav = $('.nav-links');
  const toggle = $('.menu-toggle');
  if (nav && toggle) {
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) { nav.classList.remove('open'); toggle.classList.remove('open'); toggle.textContent = '☰'; }
    });
  }
})();
