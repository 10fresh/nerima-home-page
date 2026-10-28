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
const sections = Array.from(document.querySelectorAll('main section[id]'));
const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
const statement = document.querySelector('.statement-text');
const statementChars = statement ? Array.from(statement.querySelectorAll('.char')) : [];
const ctaBar = document.querySelector('.cta-bar');
const reserve = document.querySelector('#reserve');
let ticking = false;

// ---------- Tone (dark → light) ----------
// 画面中央の位置に応じて、下の色の間をなめらかに補間する。
// [基準要素, 基準要素の上端からのずれ(画面高さ比), 背景色, 面の色]
const toneStops = [
  ['#top', 0, '#0E1311', '#161D1A'],
  ['#concept', 0, '#111816', '#1A2220'],
  ['.statement', 0, '#151D1A', '#1E2824'],
  ['#salon', -0.4, '#1A2420', '#232E29'],
  ['#salon', 0.3, '#E6E1D5', '#DCD6C8'],
  ['#menu', 0, '#EDE9DF', '#E3DED1'],
  ['#reserve', 0, '#F2EFE7', '#E8E4DA'],
  ['#access', 0, '#F7F5F0', '#EDEAE2'],
].map(([sel, offset, bg, surface]) => ({ el: document.querySelector(sel), offset, bg: hexToRgb(bg), surface: hexToRgb(surface) }));

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function paintTone(y, vh) {
  const mid = y + vh * 0.5;
  const pos = toneStops.map((s) => s.el.getBoundingClientRect().top + y + s.offset * vh);
  let bg = toneStops[toneStops.length - 1].bg;
  let surface = toneStops[toneStops.length - 1].surface;
  if (mid <= pos[0]) {
    bg = toneStops[0].bg;
    surface = toneStops[0].surface;
  } else {
    for (let i = 0; i < toneStops.length - 1; i++) {
      if (mid < pos[i + 1]) {
        const t = (mid - pos[i]) / Math.max(pos[i + 1] - pos[i], 1);
        const e = t * t * (3 - 2 * t); // smoothstep
        bg = mix(toneStops[i].bg, toneStops[i + 1].bg, e);
        surface = mix(toneStops[i].surface, toneStops[i + 1].surface, e);
        break;
      }
    }
  }
  root.style.setProperty('--bg', `rgb(${bg})`);
  root.style.setProperty('--surface', `rgb(${surface})`);
  // 背景の明るさが半分を超えたら、文字色を暗い色に切り替える
  const lum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
  root.classList.toggle('is-dark', lum < 0.45);
}

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

  // Tone: 夜明けのように、上から下へ一方向にだんだん明るくする
  paintTone(y, vh);

  let currentId = '';
  for (const sec of sections) {
    const r = sec.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) {
      currentId = sec.id;
      break;
    }
  }

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
