(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA_NUMBER = '966599993968';

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-toggle');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    $$('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
    });
    const wide = matchMedia('(min-width: 861px)');
    const onWide = (e) => { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Services sub-navigation highlight ---------- */
  const subLinks = $$('[data-sub]');
  if (subLinks.length && 'IntersectionObserver' in window) {
    const subIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        subLinks.forEach((a) => {
          const on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    subLinks.forEach((a) => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) subIO.observe(target);
    });
  }

  /* ---------- Scroll-driven: header state, CTA parallax, floating button ---------- */
  const header = $('.site-header');
  const ctaImg = $('.cta-media img');
  const cta = $('.cta-band');
  const waFloat = $('.wa-float');
  const footer = $('.site-footer');
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', scrollY > 24);
    if (ctaImg && cta && !reduce) {
      const r = cta.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        const mid = r.top + r.height / 2 - innerHeight / 2;
        ctaImg.style.setProperty('--py', (mid * -0.18).toFixed(1));
      }
    }
    if (waFloat && footer) {
      // Hide the floating button over the footer, where WhatsApp is already linked
      waFloat.classList.toggle('is-hidden', footer.getBoundingClientRect().top < innerHeight - 40);
    }
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Copy buttons ---------- */
  const toast = $('.toast');
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      if (toast) toast.textContent = ok ? 'تم النسخ: ' + text : 'تعذّر النسخ، انسخه يدويًا';
      btn.classList.toggle('is-done', ok);
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.classList.remove('is-done');
        if (toast) toast.textContent = '';
      }, 2600);
    });
  });

  /* ---------- WhatsApp message builder (contact page) ---------- */
  const form = $('[data-builder]');
  if (form) {
    form.hidden = false;
    const dateInput = $('#b-date', form);
    const guests = $('#b-guests', form);
    const preview = $('[data-preview]', form);
    const send = $('[data-send]', form);

    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const fmtDate = (v) => {
      if (!v) return '';
      const [y, m, d] = v.split('-').map(Number);
      try {
        return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          .format(new Date(y, m - 1, d));
      } catch (e) { return v; }
    };

    const build = () => {
      const trip = (form.querySelector('input[name="trip"]:checked') || {}).value || 'النزهة';
      const n = Math.min(99, Math.max(1, parseInt(guests.value, 10) || 1));
      let msg = `السلام عليكم، أرغب في الاستفسار عن رحلات ${trip} في جدة.`;
      if (dateInput.value) msg += `\nالتاريخ المفضل: ${fmtDate(dateInput.value)}.`;
      msg += `\nعدد الضيوف: ${n}.`;
      preview.textContent = msg;
      preview.style.animation = 'none';
      void preview.offsetWidth;
      preview.style.animation = '';
      send.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    };

    $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
      const n = (parseInt(guests.value, 10) || 1) + Number(b.getAttribute('data-step'));
      guests.value = String(Math.min(99, Math.max(1, n)));
      build();
    }));
    form.addEventListener('input', build);
    form.addEventListener('change', build);
    form.addEventListener('submit', (e) => e.preventDefault());
    preview.style.whiteSpace = 'pre-line';
    build();
  }
})();
