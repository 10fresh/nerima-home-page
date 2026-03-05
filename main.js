// ===================================
//   10FRESH 練馬店 — main.js
// ===================================

// ---------- Header scroll effect ----------
const header = document.querySelector('.site-header');
function onScroll() {
  if (window.scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll(
  '.section-label, .section-title, .section-lead, ' +
  '.concept-text p, .concept-image, .concept-detail, ' +
  '.menu-card, .voice-card, ' +
  '.reserve-title, .reserve-lead, .reserve-actions, .reserve-info, ' +
  '.detail-item'
);

revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings slightly
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 320);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach(el => revealObserver.observe(el));

// ---------- Smooth anchor nav ----------
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const headerH = header.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
