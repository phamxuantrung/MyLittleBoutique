import './landscapeHost.css';

export function mountLandscapeHost() {
  const host = document.querySelector<HTMLElement>('#app')!;
  host.className = 'landscape-host';
  // Installed iOS apps can report a shorter fixed-position containing block
  // near the home indicator. Their large viewport still spans the screen.
  const standalone = matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  host.classList.toggle('is-standalone', standalone);
  const stage = document.createElement('div');
  stage.className = 'landscape-stage';
  const frame = document.createElement('iframe');
  frame.id = 'landscape-game';
  frame.title = 'Tiệm thời trang nhỏ';
  frame.allow = 'autoplay; fullscreen';

  // Keep this same document alive across rotations: shop state, open panels,
  // tutorial progress and audio must not restart when the phone turns.
  frame.src = location.href;
  host.append(stage);

  const resize = () => {
    const rotated = host.clientHeight > host.clientWidth;
    host.classList.toggle('is-rotated', rotated);
    const { width, height } = stage.getBoundingClientRect();
    stage.style.setProperty('--frame-width', `${width}px`);
    frame.style.width = `${rotated ? height : width}px`;
    frame.style.height = `${rotated ? width : height}px`;
    const physical = getComputedStyle(host);
    // In a clockwise-rotated frame, physical top is the game's left edge.
    const mapping = rotated
      ? { top: 'right', right: 'bottom', bottom: 'left', left: 'top' }
      : { top: 'top', right: 'right', bottom: 'bottom', left: 'left' };
    for (const [edge, deviceEdge] of Object.entries(mapping)) {
      const value = physical.getPropertyValue(`--device-${deviceEdge}`).trim() || '0px';
      frame.setAttribute(`data-safe-${edge}`, value);
      frame.contentDocument?.documentElement.style.setProperty(`--game-safe-${edge}`, value);
    }
  };
  frame.addEventListener('load', resize);
  resize();
  stage.append(frame);
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  window.addEventListener('pageshow', resize);
  if (import.meta.hot) import.meta.hot.dispose(() => {
    observer.disconnect();
    window.removeEventListener('resize', resize);
    window.visualViewport?.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', resize);
    frame.removeEventListener('load', resize);
  });
}
