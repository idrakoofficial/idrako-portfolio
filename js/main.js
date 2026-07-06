/* ============================================================
   IDRAKO — motion engine
   preloader → smooth scroll → showcase stage with ambient
   color morph → neon proximity glow.
   ============================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* always open at the top — never restore a previous scroll position */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------- project data ---------- */
const PROJECTS = {
  brand: [
    { slug:'bound',         title:'Bound',        meta:'2026 · fantasy · reel',   accent:'#987064',
      log:'a knight, a queen, and the kingdom neither of them chose.' },
    { slug:'reckoning',     file:'reel-finale-2', title:'Reckoning', meta:'2026 · fantasy · reel', accent:'#1D4977',
      log:'the myth moves. a king, a storm of light, and everything it burned.' },
    { slug:'duel',          title:'The Duel',     meta:'2026 · fantasy · reel',   accent:'#2466AC',
      log:'blue fire, old grudges. only one walks out of the temple.' },
    { slug:'spy-agent',     title:'Rooftop Protocol', meta:'2026 · action · reel', accent:'#175772',
      log:'the extraction went wrong on floor sixty.' },
    { slug:'sea-monster',   title:'Leviathan',    meta:'2026 · fantasy · reel',   accent:'#315972',
      log:'something old woke under the storm. the boat is very small.' },
    { slug:'pov-drago',     title:'Dragonback',   meta:'2026 · fantasy · reel',   accent:'#9F7E57',
      log:'no cuts. no ground. first person on the spine of a dragon.' },
    { slug:'kaiju',         title:'Kaiju',        meta:'2026 · sci-fi · reel',    accent:'#345372',
      log:'the fleet opens fire. the sea fires back.' },
    { slug:'devil',         title:'Red Devil',    meta:'2026 · sci-fi · reel',    accent:'#13637A',
      log:'two machines built for war. one corridor between them.' },
    { slug:'space',         title:'Arachnid Moon',meta:'2026 · sci-fi · reel',    accent:'#253072',
      log:'one suit between him and the thing in the dust.' },
    { slug:'outrun',        file:'reel-finale-1', title:'Outrun', meta:'2026 · fantasy · reel', accent:'#265672',
      log:'i let it run. he flies. it follows.' },
  ],
  school: [
    { slug:'futurenova',    title:'Futurenova',   meta:'2026 · spot · its ammi',  accent:'#1C66A3',
      log:'cinema without a set. a spot for a virtual production studio.' },
    { slug:'zyro',          title:'Zyro',         meta:'2026 · commercial · its ammi', accent:'#7B574D',
      log:'a running shoe forged in rain and mud.' },
    { slug:'nasa',          title:'The Astronaut', file:'nasa', meta:'2026 · interview · its ammi', accent:'#724E2D',
      log:'an interview edit on the men who left the planet.' },
    { slug:'entom',         title:'Entom',        meta:'2026 · spot · its ammi',  accent:'#C9A50B',
      log:'insect protein poured like treasure. a drink from another kingdom of nature.' },
    { slug:'limo',          title:'Limo',         meta:'2026 · spot · its ammi',  accent:'#C9A83F',
      log:'lemons, mint, white light. a summer drink shot like a ritual.' },
  ],
};

const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

/* ---------- entry — fade in as soon as fonts are usable ---------- */
(() => {
  const go = () => {
    if (document.body.classList.contains('ready')) return;
    window.scrollTo(0, 0);
    document.body.classList.add('ready');
    $('.hero-media video')?.play?.().catch(()=>{});
  };
  Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 700)),
  ]).then(go);
})();

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!REDUCED && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.05 });
  lenis.on('scroll', () => ScrollTrigger.update());
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
gsap.registerPlugin(ScrollTrigger);
/* keep scroll restoration off even across ScrollTrigger refreshes */
ScrollTrigger.clearScrollMemory('manual');

$$('a[data-scroll]').forEach(a => {
  a.addEventListener('click', e => {
    const target = a.getAttribute('href');
    if (!target.startsWith('#')) return;
    e.preventDefault();
    if (a.dataset.feature) featureBySlug(a.dataset.feature);
    const el = $(target === '#top' ? 'body' : target);
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    else el.scrollIntoView({ behavior: 'smooth' });
  });
});

/* nav: hide on scroll down, show on scroll up */
(() => {
  let last = 0;
  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('hide', y > 140 && y > last);
    last = y;
  }, { passive: true });
})();

/* ---------- scroll reveals ---------- */
$$('.reveal').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});
/* statement lines start hidden via css (translateY(115%)); animate to 0 */
$$('#origin .line > span, #contact .line > span').forEach((el, i) => {
  gsap.to(el, {
    y: 0, duration: 1.15, ease: 'power4.out', delay: (i % 2) * 0.12,
    scrollTrigger: { trigger: el.closest('.statement'), start: 'top 85%' },
  });
});

/* ============================================================
   showcase stage — the reference-video move:
   crossfade artwork + morph the page ambient color
   ============================================================ */
const stage = {
  deck: 'brand',
  index: 0,
  front: 'A',
  el: $('#stage'),
  vids: { A: $('#stage .layerA'), B: $('#stage .layerB') },
  title: $('.stage-title span'),
  meta: $('.stage-meta'),
  log: $('.stage-log'),
  idx: $('.stage-index'),
  rail: $('.rail'),
  muted: true,
};

const fileOf = p => p.file || p.slug;

function setAccent(hex){
  gsap.to('html', { '--accent': hex, duration: 1.3, ease: 'power2.out' });
}

function feature(i, { instant = false } = {}){
  const list = PROJECTS[stage.deck];
  stage.index = (i + list.length) % list.length;
  const p = list[stage.index];

  /* video crossfade between two layers */
  const inKey  = stage.front === 'A' ? 'B' : 'A';
  const vIn  = stage.vids[inKey];
  const vOut = stage.vids[stage.front];
  vIn.src = `video/${fileOf(p)}.mp4`;
  vIn.poster = `posters/${fileOf(p)}.jpg`;
  vIn.muted = stage.muted;
  vIn.play().catch(()=>{});
  vIn.classList.add('show');
  vOut.classList.remove('show');
  setTimeout(() => { if (!vOut.classList.contains('show')) { vOut.pause(); vOut.removeAttribute('src'); vOut.load(); } }, 950);
  stage.front = inKey;

  /* text swap */
  if (!instant && !REDUCED){
    gsap.fromTo(stage.title, { yPercent: 115 }, { yPercent: 0, duration: .9, ease: 'power4.out' });
    gsap.fromTo([stage.meta, stage.log], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out', delay: .1 });
  }
  stage.title.textContent = p.title;
  stage.meta.textContent = p.meta;
  stage.log.textContent = p.log;
  stage.idx.textContent = String(stage.index + 1).padStart(2, '0');

  /* ambient morph — the whole page follows the world */
  setAccent(p.accent);

  $$('.thumb', stage.rail).forEach((t, ti) => t.classList.toggle('active', ti === stage.index));
  $$('.thumb', stage.rail)[stage.index]?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
}

function featureBySlug(slug){
  for (const deck of ['brand','school']){
    const i = PROJECTS[deck].findIndex(p => p.slug === slug);
    if (i !== -1){
      if (deck !== stage.deck) switchDeck(deck, i);
      else feature(i);
      return;
    }
  }
}

function buildRail(){
  stage.rail.innerHTML = '';
  PROJECTS[stage.deck].forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'thumb';
    b.setAttribute('role', 'listitem');
    b.innerHTML = `<img src="posters/${fileOf(p)}.jpg" alt="${p.title}" loading="lazy">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="tl">${p.title}</span>`;
    b.addEventListener('click', () => feature(i));
    stage.rail.appendChild(b);
  });
}

function switchDeck(deck, startAt = 0){
  if (deck === stage.deck) return;
  $$('.tab').forEach(t => {
    const on = t.dataset.deck === deck;
    t.classList.toggle('on', on);
    t.setAttribute('aria-selected', on);
  });
  const wipe = $('#wipe');
  const swap = () => {
    stage.deck = deck;
    buildRail();
    feature(startAt, { instant: true });
  };
  if (REDUCED){ swap(); return; }
  wipe.classList.remove('go');
  void wipe.offsetWidth;            /* restart animation */
  wipe.classList.add('go');
  setTimeout(swap, 460);            /* swap while fully covered */
}

$$('.tab').forEach(t => t.addEventListener('click', () => switchDeck(t.dataset.deck)));

/* sound toggle on the stage */
$('.stage-sound').addEventListener('click', () => {
  stage.muted = !stage.muted;
  Object.values(stage.vids).forEach(v => v.muted = stage.muted);
  $('.stage-sound').setAttribute('aria-pressed', String(!stage.muted));
});

/* keyboard: arrows move through the featured deck */
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') feature(stage.index + 1);
  if (e.key === 'ArrowLeft')  feature(stage.index - 1);
});

/* pause stage videos when offscreen, resume when visible */
new IntersectionObserver(entries => {
  entries.forEach(en => {
    const v = stage.vids[stage.front];
    if (en.isIntersecting) v.play().catch(()=>{});
    else v.pause();
  });
}, { threshold: 0.15 }).observe(stage.el);

/* hero video too — don't burn the gpu while it's offscreen */
(() => {
  const hv = $('.hero-media video');
  if (!hv) return;
  new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) hv.play().catch(()=>{});
      else hv.pause();
    });
  }, { threshold: 0.05 }).observe($('#hero'));
})();

buildRail();
feature(0, { instant: true });

/* ============================================================
   neon proximity glow — icons light up as the cursor nears,
   before it ever touches them. native cursor stays native.
   ============================================================ */
(() => {
  const orbs = $$('.orb');
  if (!orbs.length || window.matchMedia('(hover: none)').matches) return;
  const RADIUS = 240;
  let px = -1e4, py = -1e4, raf = null;

  function paint(){
    raf = null;
    orbs.forEach(orb => {
      const r = orb.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(px - cx, py - cy);
      const glow = Math.max(0, 1 - d / RADIUS);
      orb.style.setProperty('--glow', glow.toFixed(3));
      if (glow > 0){
        orb.style.setProperty('--mx', `${((px - r.left) / r.width * 100).toFixed(1)}%`);
        orb.style.setProperty('--my', `${((py - r.top) / r.height * 100).toFixed(1)}%`);
      }
    });
  }
  window.addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
})();

/* ============================================================
   starfield — slow drifting, softly twinkling particles
   (reference video 2). canvas is cheap: ~140 dots, no blur.
   ============================================================ */
(() => {
  const canvas = $('#stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], w = 0, h = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function build(){
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * DPR; canvas.height = h * DPR;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round((w * h) / 11000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: .4 + Math.random() * 1.3,
      a: .15 + Math.random() * .55,
      tw: .3 + Math.random() * 1.4,
      ph: Math.random() * Math.PI * 2,
      vx: -.02 - Math.random() * .06,
      vy: .015 + Math.random() * .05,
    }));
  }

  function draw(t){
    ctx.clearRect(0, 0, w, h);
    for (const s of stars){
      s.x += s.vx; s.y += s.vy;
      if (s.x < -2) s.x = w + 2;
      if (s.y > h + 2) s.y = -2;
      const alpha = s.a * (.55 + .45 * Math.sin(t * .001 * s.tw + s.ph));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#dfeefb';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  build();
  window.addEventListener('resize', build);
  if (REDUCED){ draw(0); return; }
  const loop = t => { draw(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();

/* active nav pill follows the section in view */
(() => {
  const map = [['#origin','origin'],['#work','work'],['#contact','contact']];
  map.forEach(([sel]) => {
    ScrollTrigger.create({
      trigger: sel, start: 'top 55%', end: 'bottom 45%',
      onToggle(self){
        $$('.pills a').forEach(a => a.classList.toggle('here', self.isActive && a.getAttribute('href') === sel));
      },
    });
  });
})();
