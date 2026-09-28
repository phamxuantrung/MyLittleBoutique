import './landscapeHost.css';

export function mountLandscapeHost() {
  const host = document.querySelector<HTMLElement>('#app')!;
  host.className = 'landscape-host';
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
    // Use the visible viewport, not lvh: iOS can clip the large viewport
    // while its system UI is visible. In portrait that clips the game's right.
    const bounds = host.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = Math.max(bounds.left, viewport?.offsetLeft ?? 0);
    const top = Math.max(bounds.top, viewport?.offsetTop ?? 0);
    const right = Math.min(bounds.right, viewport ? viewport.offsetLeft + viewport.width : innerWidth);
    const bottom = Math.min(bounds.bottom, viewport ? viewport.offsetTop + viewport.height : innerHeight);
    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);
    stage.style.left = `${left - bounds.left}px`;
    stage.style.top = `${top - bounds.top}px`;
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    const rotated = height > width;
    host.classList.toggle('is-rotated', rotated);
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
  observer.observe(host);
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('scroll', resize);
  window.addEventListener('pageshow', resize);
  if (import.meta.hot) import.meta.hot.dispose(() => {
    observer.disconnect();
    window.removeEventListener('resize', resize);
    window.visualViewport?.removeEventListener('resize', resize);
    window.visualViewport?.removeEventListener('scroll', resize);
    window.removeEventListener('pageshow', resize);
    frame.removeEventListener('load', resize);
  });
}
