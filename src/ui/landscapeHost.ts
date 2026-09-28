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
    const { width, height } = stage.getBoundingClientRect();
    const rotated = height > width;
    host.classList.toggle('is-rotated', rotated);
    stage.style.setProperty('--frame-width', `${width}px`);
    frame.style.width = `${rotated ? height : width}px`;
    frame.style.height = `${rotated ? width : height}px`;
  };
  resize();
  stage.append(frame);
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  if (import.meta.hot) import.meta.hot.dispose(() => observer.disconnect());
}
