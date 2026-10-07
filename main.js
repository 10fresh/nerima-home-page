// ===================================
//   10FRESH 練馬店 — main.js
// ===================================

const root = document.documentElement;
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Split text into characters ----------
// 見出しを一文字ずつ <span> に分け、順番に浮かび上がらせる
document.querySelectorAll('[data-split]').forEach((el) => {
  const scope = el.closest('h1, p');
  let i = scope.querySelectorAll('.char').length;
  const chars = Array.from(el.textContent.trim());
  el.textContent = '';
  chars.forEach((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--i', i++);
    span.textContent = ch;
    el.appendChild(span);
  });
});

// ---------- Mobile navigation ----------
const navToggle = document.querySelector('.nav-toggle');
function setNav(open) {
  header.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  document.body.style.overflow = open ? 'hidden' : '';
}
navToggle.addEventListener('click', () => setNav(!header.classList.contains('nav-open')));
document.querySelectorAll('.site-nav a, .logo').forEach((a) => a.addEventListener('click', () => setNav(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNav(false);
});

// ---------- Scroll-linked effects ----------
const toneSections = Array.from(document.querySelectorAll('[data-tone]'));
const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
const statement = document.querySelector('.statement-text');
const statementChars = statement ? Array.from(statement.querySelectorAll('.char')) : [];
const ctaBar = document.querySelector('.cta-bar');
const reserve = document.querySelector('#reserve');
let ticking = false;

function update() {
  ticking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const mid = vh * 0.5;

  // Header
  header.classList.toggle('scrolled', y > 60);

  // Hero: ゆっくりズームしながら文字が消えていく
  if (!reduceMotion && y < vh * 1.2) {
    hero.style.setProperty('--p', Math.min(y / vh, 1).toFixed(3));
  }

  // Tone: 画面中央にあるセクションに合わせて、昼 ⇄ 夜を切り替える
  let tone = 'light';
  let currentId = '';
  for (const sec of toneSections) {
    const r = sec.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) {
      tone = sec.dataset.tone;
      currentId = sec.id;
      break;
    }
  }
  if (y + vh >= document.documentElement.scrollHeight - 2) tone = 'dark';
  root.classList.toggle('is-dark', tone === 'dark');

  // 現在地をナビに表示
  navLinks.forEach((a) => {
    if (a.getAttribute('href') === '#' + currentId) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });

  // Statement: スクロールに合わせて一文字ずつ灯っていく
  if (statement) {
    const r = statement.getBoundingClientRect();
    const start = vh * 0.82;
    const end = vh * 0.42;
    const p = (start - r.top) / (start - end + r.height * 0.6);
    const lit = Math.round(Math.max(0, Math.min(1, p)) * statementChars.length);
    statementChars.forEach((c, i) => c.classList.toggle('on', i < lit));
  }

  // スマホ用の固定予約バー：ヒーローを過ぎたら出し、予約セクションでは隠す
  if (ctaBar) {
    const rr = reserve.getBoundingClientRect();
    const inReserve = rr.top < vh * 0.7;
    ctaBar.classList.toggle('show', y > vh * 0.7 && !inReserve);
  }
}

function requestUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}
window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
update();

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll('[data-reveal]');

// 同じ親の中に並ぶ要素は、少しずつ遅らせて表示する
revealEls.forEach((el) => {
  const siblings = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
  const idx = siblings.indexOf(el);
  el.style.setProperty('--d', Math.min(idx * 0.11, 0.44) + 's');
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  // ---------- Videos: 画面内にあるときだけ再生 ----------
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting && !reduceMotion) {
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll('.hero-video, video[data-autoplay]').forEach((v) => videoObserver.observe(v));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
