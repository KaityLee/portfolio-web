// Sliding indicator for single-choice controls (DESIGN.md §8 "Segmented control", §9).
// Markup: a positioned container with `data-segmented`, one `.segmented-indicator` child and the
// choices as buttons (`aria-pressed`) or links (`aria-current`). The indicator is placed under the
// chosen item and slides when the choice changes. Without JS the chosen item keeps its own
// background (see `.segmented:not(.is-ready)` in global.css).

const CHOSEN = '[aria-pressed="true"], [aria-current="true"], [aria-current="page"]';
const SLIDE_MS = 220; // matches the indicator transition in global.css
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function place(group: HTMLElement): void {
  const chosen = group.querySelector<HTMLElement>(CHOSEN);
  if (!chosen || chosen.offsetWidth === 0) {
    group.classList.toggle('has-indicator', false);
    return;
  }
  group.style.setProperty('--seg-x', `${chosen.offsetLeft}px`);
  group.style.setProperty('--seg-y', `${chosen.offsetTop}px`);
  group.style.setProperty('--seg-w', `${chosen.offsetWidth}px`);
  group.style.setProperty('--seg-h', `${chosen.offsetHeight}px`);
  group.classList.add('has-indicator');
}

/** First placement and size changes jump; only a change of choice slides. */
function placeWithoutSlide(group: HTMLElement): void {
  group.classList.remove('is-ready');
  place(group);
  requestAnimationFrame(() => requestAnimationFrame(() => group.classList.add('is-ready')));
}

function init(group: HTMLElement): void {
  if (group.dataset.segmentedReady) return;
  group.dataset.segmentedReady = 'true';
  // Remember the server-rendered choice so a page restored from the back/forward cache can undo a
  // click that started navigating away.
  for (const link of group.querySelectorAll<HTMLAnchorElement>('a[aria-current]')) link.dataset.segmentedCurrent = 'true';
  placeWithoutSlide(group);

  // Buttons: the owner script flips aria-pressed; follow it.
  new MutationObserver(() => place(group)).observe(group, {
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-pressed', 'aria-current'],
  });
  // Hidden until opened (menu sheet, dialog), fonts loading, resizing: re-measure without sliding.
  new ResizeObserver(() => placeWithoutSlide(group)).observe(group);

  // Links lead to another page, where the indicator is drawn at its new place without motion.
  // Slide first, then follow the link, so the choice visibly moves before the page changes.
  group.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!link || !group.contains(link) || link.matches(CHOSEN)) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reduceMotion.matches) return;
    event.preventDefault();
    group.querySelector<HTMLElement>(CHOSEN)?.removeAttribute('aria-current');
    link.setAttribute('aria-current', 'true');
    window.setTimeout(() => location.assign(link.href), SLIDE_MS);
  });
}

function initAll(): void {
  for (const group of document.querySelectorAll<HTMLElement>('[data-segmented]')) init(group);
}

initAll();
// Restored from the back/forward cache: the old page may still show the clicked choice.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  for (const group of document.querySelectorAll<HTMLElement>('[data-segmented]')) {
    for (const link of group.querySelectorAll<HTMLAnchorElement>('a[data-segmented-current]')) link.setAttribute('aria-current', 'true');
    for (const link of group.querySelectorAll<HTMLAnchorElement>('a[aria-current]:not([data-segmented-current])')) link.removeAttribute('aria-current');
    placeWithoutSlide(group);
  }
});
