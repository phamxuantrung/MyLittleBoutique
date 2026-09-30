export const DAYS_PER_GAME_MONTH = 30;
export const GAME_MONTHS_PER_CYCLE = 12;

export function gameCalendarDate(absoluteDay: number) {
  const normalized = Math.max(1, Math.floor(absoluteDay || 1)) - 1;
  return {
    day: normalized % DAYS_PER_GAME_MONTH + 1,
    month: Math.floor(normalized / DAYS_PER_GAME_MONTH) % GAME_MONTHS_PER_CYCLE + 1,
  };
}

export function gameDate(absoluteDay: number) {
  const date = gameCalendarDate(absoluteDay);
  return `${String(date.day).padStart(2, '0')}/${String(date.month).padStart(2, '0')}`;
}

export function gameDateLong(absoluteDay: number) {
  const date = gameCalendarDate(absoluteDay);
  return `ngày ${String(date.day).padStart(2, '0')} tháng ${String(date.month).padStart(2, '0')}`;
}
