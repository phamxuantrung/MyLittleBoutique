export const COURIER_APPEARANCE_COUNT = 3;

export const courierArtwork = (variant: number) => {
  const integer = Number.isFinite(variant) ? Math.trunc(variant) : 0;
  const normalized = ((integer % COURIER_APPEARANCE_COUNT) + COURIER_APPEARANCE_COUNT) % COURIER_APPEARANCE_COUNT;
  return `/assets/characters/couriers/${String(normalized + 1).padStart(2, '0')}.webp`;
};

export const allCourierArtwork = Object.freeze(
  Array.from({ length: COURIER_APPEARANCE_COUNT }, (_, variant) => courierArtwork(variant)),
);

export const courierImage = (variant: number) => `<img class="courier-art" src="${courierArtwork(variant)}" alt="" aria-hidden="true" draggable="false" />`;
