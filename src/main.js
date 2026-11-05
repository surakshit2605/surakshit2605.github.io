import './styles/main.css';
import { gsap } from 'gsap';
import { render } from './render.js';
import { createScene } from './scene/scene.js';
import { playIntro, initScroll, initNav } from './animations.js';
import { initContactForm } from './contactForm.js';
import { initLightbox } from './lightbox.js';
import { initMenu } from './menu.js';
import { initTheme } from './theme.js';
import { initInfo } from './info.js';
import { initHeroHover } from './hero-hover.js';
import { initPhotoFx } from './photo-fx.js';
import { initJourneyMap } from './map.js';
import { initAtmosphere } from './atmosphere.js';
import { applyAccent, savedAccent } from './accents.js';
import { initAccent } from './accent.js';
import { logoSvg, initLogoHover } from './logo.js';

async function start() {
  applyAccent(savedAccent());
  document.querySelectorAll('[data-logo]').forEach((el) => {
    const kind = el.dataset.logo || 'nav';
    // Navbar and footer show the monogram plus the first name in full.
    el.innerHTML = logoSvg(kind) + (kind === 'loader' ? '' : '<span class="logo__word" aria-hidden="true">Surakshit</span>');
  });
  render();
  initJourneyMap();

  const canvas = document.getElementById('scene');
  const scene = await createScene(canvas);
  if (!scene) document.documentElement.classList.add('no-webgl');

  initNav();
  initInfo();
  initHeroHover();
  initPhotoFx();
  initLogoHover();
  initMenu();
  initTheme(scene);
  initAccent(scene);
  initContactForm();
  initLightbox();
  initScroll(scene);
  initAtmosphere();

  // Lock scroll during the loader so the hero entrance is not missed.
  document.body.style.overflow = 'hidden';
  await playIntro(scene ? scene.ready : Promise.resolve());
  document.body.style.overflow = '';

  // If the page opened part-way down (#hash link or a reload that restores scroll), the scroll-triggered
  // reveals for everything already passed would never fire. Show those elements straight away.
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.96) gsap.set(el, { opacity: 1, y: 0 });
    });
  }, 400);
}

start();
