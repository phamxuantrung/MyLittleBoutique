export const EMPLOYEE_APPEARANCE_COUNT = 10;

export const employeeArtwork = (appearance: number) => {
  const integer = Number.isFinite(appearance) ? Math.trunc(appearance) : 0;
  const normalized = ((integer % EMPLOYEE_APPEARANCE_COUNT) + EMPLOYEE_APPEARANCE_COUNT) % EMPLOYEE_APPEARANCE_COUNT;
  return `/assets/characters/employees/${String(normalized + 1).padStart(2, '0')}.webp`;
};
