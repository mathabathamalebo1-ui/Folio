/* ============================================================
   MALEBO MATHABATHA — PORTFOLIO SCRIPT
   Covers: nav, scroll animations, timeline expand,
           project lightbox, certificate modal, contact form,
           scroll-to-top, page transitions
   ============================================================ */

'use strict';

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * Shorthand query selectors
 */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Add multiple event listeners in one call
 */
function on(el, events, handler) {
  if (!el) return;
  events.split(' ').forEach(evt => el.addEventListener(evt, handler));
}

/* ── 1. NAV — scroll shrink + active link + hamburger ───── */

function initNav() {
  const nav        = qs('.nav');
  const burger     = qs('.nav__burger');
  const mobileMenu = qs('.nav__mobile');

  if (!nav) return;

  // Shrink nav on scroll
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);

    // Show/hide scroll-to-top button
    const scrollBtn = qs('.scroll-top');
    if (scrollBtn) {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Highlight active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  qsa('.nav__link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (
      href === currentPage ||
      (currentPage === '' && href === 'index.html') ||
      (currentPage === 'index.html' && href === 'index.html')
    ) {
      link.classList.add('active');
    }
  });

  // Hamburger toggle
  if (burger && mobileMenu) {
    on(burger, 'click', () => {
      const isOpen = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    });

    // Close mobile menu on link click
    qsa('.nav__link', mobileMenu).forEach(link => {
      on(link, 'click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
      }
    });
  }
}

/* ── 2. SCROLL-TRIGGERED FADE-INS (Intersection Observer) ── */

function initScrollAnimations() {
  const targets = qsa('.fade-in');
  if (!targets.length) return;

  // Reduce motion: skip animation if user prefers it
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  targets.forEach(el => observer.observe(el));
}

/* ── 3. TIMELINE EXPAND / COLLAPSE ──────────────────────── */

function initTimeline() {
  qsa('.timeline__toggle').forEach(btn => {
    const bodyId = btn.getAttribute('data-target');
    const body   = bodyId ? qs(`#${bodyId}`) : null;
    if (!body) return;

    // Set initial ARIA
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', bodyId);

    on(btn, 'click', () => {
      const isOpen = body.classList.toggle('open');
      btn.classList.toggle('expanded', isOpen);
      btn.setAttribute('aria-expanded', isOpen);

      // Update label text
      const label = btn.querySelector('.toggle-label');
      if (label) {
        label.textContent = isOpen ? 'Show less' : 'Show more';
      }
    });
  });
}

/* ── 4. CERTIFICATE / PDF MODAL ──────────────────────────── */

let currentModal = null;

function openModal(pdfSrc, title) {
  // Remove any existing modal
  closeModal();

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', title);
  modal.innerHTML = `
    <div class="modal__inner">
      <div class="modal__header">
        <span class="modal__header-title">${title}</span>
        <button class="modal__close" aria-label="Close modal">&#x2715;</button>
      </div>
      <div class="modal__body">
        <embed src="${pdfSrc}#toolbar=0&navpanes=0&scrollbar=0"
               type="application/pdf"
               title="${title}"
               width="100%"
               height="100%">
        </embed>
      </div>
      <div class="modal__footer">
        <a href="${pdfSrc}" download class="btn btn--outline" style="font-size:0.82rem;padding:0.45rem 1.1rem;">
          ⬇ Download
        </a>
        <button class="btn btn--ghost modal__close-btn" style="font-size:0.82rem;padding:0.45rem 1.1rem;">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => modal.classList.add('open'));
  });

  // Close handlers
  const closeBtns = qsa('.modal__close, .modal__close-btn', modal);
  closeBtns.forEach(btn => on(btn, 'click', closeModal));

  // Click backdrop
  on(modal, 'click', e => {
    if (e.target === modal) closeModal();
  });

  // Keyboard ESC
  const onKeydown = e => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', onKeydown);
  modal._onKeydown = onKeydown;

  // Focus trap — focus the close button
  const closeBtn = qs('.modal__close', modal);
  if (closeBtn) closeBtn.focus();

  currentModal = modal;
}

function closeModal() {
  if (!currentModal) return;
  const modal = currentModal;
  currentModal = null;

  modal.classList.remove('open');
  document.body.style.overflow = '';

  if (modal._onKeydown) {
    document.removeEventListener('keydown', modal._onKeydown);
  }

  // Remove after transition
  modal.addEventListener('transitionend', () => modal.remove(), { once: true });
}

function initCertCards() {
  // "View Certificate" buttons
  qsa('[data-cert-pdf]').forEach(btn => {
    on(btn, 'click', () => {
      const pdf   = btn.getAttribute('data-cert-pdf');
      const title = btn.getAttribute('data-cert-title') || 'Certificate';
      openModal(pdf, title);
    });
  });

  // Clickable cert preview panels
  qsa('[data-preview-pdf]').forEach(panel => {
    panel.setAttribute('role', 'button');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-label', `Preview ${panel.getAttribute('data-preview-title') || 'certificate'}`);

    on(panel, 'click keydown', e => {
      if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const pdf   = panel.getAttribute('data-preview-pdf');
        const title = panel.getAttribute('data-preview-title') || 'Certificate';
        openModal(pdf, title);
      }
    });
  });
}

/* ── 5. PROJECT IMAGE LIGHTBOX ──────────────────────────── */

function initProjectLightbox() {
  qsa('[data-lightbox]').forEach(trigger => {
    on(trigger, 'click keydown', e => {
      if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const src   = trigger.getAttribute('data-lightbox');
        const title = trigger.getAttribute('data-lightbox-title') || '';
        openImageLightbox(src, title);
      }
    });
  });
}

function openImageLightbox(src, title) {
  closeModal(); // reuse the close mechanism

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', title || 'Image preview');
  lb.innerHTML = `
    <div class="lightbox__inner">
      <div class="lightbox__header">
        <span class="lightbox__title">${title}</span>
        <button class="lightbox__close" aria-label="Close">&times;</button>
      </div>
      <div class="lightbox__body">
        <img src="${src}" alt="${title}" loading="lazy">
      </div>
    </div>
  `;

  document.body.appendChild(lb);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => lb.classList.add('open'));
  });

  const close = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    lb.addEventListener('transitionend', () => lb.remove(), { once: true });
  };

  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  on(qs('.lightbox__close', lb), 'click', close);
  on(lb, 'click', e => { if (e.target === lb) close(); });

  // Focus close button
  qs('.lightbox__close', lb)?.focus();
}

/* ── 6. CONTACT FORM VALIDATION ──────────────────────────── */

function initContactForm() {
  const form = qs('#contact-form');
  if (!form) return;

  const fields = {
    name:    { el: qs('#field-name',    form), msg: qs('#err-name',    form) },
    email:   { el: qs('#field-email',   form), msg: qs('#err-email',   form) },
    message: { el: qs('#field-message', form), msg: qs('#err-message', form) }
  };

  const successBanner = qs('.form__success', form);

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function setError(field, message) {
    field.el.classList.add('error');
    field.el.closest('.form-group').classList.add('has-error');
    if (field.msg) field.msg.textContent = message;
  }

  function clearError(field) {
    field.el.classList.remove('error');
    field.el.closest('.form-group').classList.remove('has-error');
  }

  // Live validation on blur
  Object.values(fields).forEach(field => {
    on(field.el, 'blur', () => {
      if (field.el.value.trim()) clearError(field);
    });
  });

  on(form, 'submit', e => {
    e.preventDefault();
    let valid = true;

    // Name
    if (!fields.name.el.value.trim()) {
      setError(fields.name, 'Please enter your name.');
      valid = false;
    } else {
      clearError(fields.name);
    }

    // Email
    if (!fields.email.el.value.trim()) {
      setError(fields.email, 'Please enter your email address.');
      valid = false;
    } else if (!validateEmail(fields.email.el.value)) {
      setError(fields.email, 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError(fields.email);
    }

    // Message
    if (!fields.message.el.value.trim()) {
      setError(fields.message, 'Please write a message.');
      valid = false;
    } else if (fields.message.el.value.trim().length < 10) {
      setError(fields.message, 'Message is too short (minimum 10 characters).');
      valid = false;
    } else {
      clearError(fields.message);
    }

    if (!valid) return;

    // Build mailto fallback
    const name    = encodeURIComponent(fields.name.el.value.trim());
    const email   = encodeURIComponent(fields.email.el.value.trim());
    const message = encodeURIComponent(fields.message.el.value.trim());
    const subject = encodeURIComponent(`Portfolio message from ${fields.name.el.value.trim()}`);
    const body    = encodeURIComponent(
      `Name: ${fields.name.el.value.trim()}\nEmail: ${fields.email.el.value.trim()}\n\n${fields.message.el.value.trim()}`
    );

    window.location.href = `mailto:mathabatha.malebo1@gmail.com?subject=${subject}&body=${body}`;

    // Show success banner
    if (successBanner) {
      successBanner.style.display = 'block';
      form.reset();
      setTimeout(() => { successBanner.style.display = 'none'; }, 6000);
    }
  });
}

/* ── 7. SCROLL TO TOP BUTTON ─────────────────────────────── */

function initScrollTop() {
  const btn = qs('.scroll-top');
  if (!btn) return;
  on(btn, 'click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── 8. PAGE ENTRANCE ANIMATION ──────────────────────────── */

function initPageEntrance() {
  // Add a subtle fade-in to the whole page body on load
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });

  // Smooth page exits on internal nav clicks
  qsa('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only internal relative links
    if (!href || href.startsWith('#') || href.startsWith('mailto') ||
        href.startsWith('tel') || href.startsWith('http')) return;

    on(link, 'click', e => {
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 300);
    });
  });
}

/* ── 9. ACTIVE NAV HIGHLIGHTING (multi-page) ─────────────── */

function highlightNav() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';

  qsa('.nav__link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (
      href === file ||
      (file === '' && href === 'index.html') ||
      (file === 'index.html' && href === 'index.html')
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ── 10. INIT ─────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  highlightNav();
  initScrollAnimations();
  initTimeline();
  initCertCards();
  initProjectLightbox();
  initContactForm();
  initScrollTop();
  initPageEntrance();
});

/* ── 11. EXPOSE helpers for inline use if needed ─────────── */
window.PortfolioApp = {
  openModal,
  closeModal,
  openImageLightbox
};
