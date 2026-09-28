// Give mobile browsers a real landscape layout viewport, even when the device
// is upright. Rotating an iframe also lets the browser map touch coordinates,
// native dialogs and scrolling; rotating only #app would leave those out of sync.
const insideGameFrame = window.frameElement?.id === 'landscape-game';
document.documentElement.classList.toggle('landscape-game-frame', insideGameFrame);
if (insideGameFrame) {
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    document.documentElement.style.setProperty(`--game-safe-${edge}`, window.frameElement!.getAttribute(`data-safe-${edge}`) || '0px');
  }
}
const needsLandscapeHost = !insideGameFrame && (
  matchMedia('(pointer: coarse)').matches ||
  matchMedia('(orientation: portrait) and (max-width: 900px)').matches
);

if (needsLandscapeHost) {
  const { mountLandscapeHost } = await import('./ui/landscapeHost');
  mountLandscapeHost();
} else {
  await import('./main');
}

export {};
