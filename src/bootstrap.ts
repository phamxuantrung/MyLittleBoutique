// Give mobile browsers a real landscape layout viewport, even when the device
// is upright. Rotating an iframe also lets the browser map touch coordinates,
// native dialogs and scrolling; rotating only #app would leave those out of sync.
const insideGameFrame = window.frameElement?.id === 'landscape-game';
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
