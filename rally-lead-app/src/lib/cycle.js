// Cycle-anchor math. Every profile carries a `cycleAnchor` (ISO date) marking
// when day 1 of its 28-day pack-rotation cycle was. These helpers map "now"
// to a 1..28 day-of-cycle and let us ask "is this pack available today?".

const MS_PER_DAY = 86_400_000;
const DEFAULT_CYCLE_DAYS = 28;

// Returns the 1-indexed day-of-cycle for `now` relative to `cycleAnchor`.
// Day-of-anchor is day 1.
export function dayOfCycle(cycleAnchor, now = new Date(), cycleDays = DEFAULT_CYCLE_DAYS) {
  if (!cycleAnchor) return null;
  const anchor = new Date(cycleAnchor);
  if (isNaN(anchor.getTime())) return null;
  const elapsed = Math.floor((now.getTime() - anchor.getTime()) / MS_PER_DAY);
  return (((elapsed % cycleDays) + cycleDays) % cycleDays) + 1;
}

// Is day-of-cycle `day` inside this window? Handles wrap-around windows
// like Combat Medic's Days 28→1.
export function isDayInWindow(day, window, cycleDays = DEFAULT_CYCLE_DAYS) {
  if (!window || !Array.isArray(window.days) || window.days.length !== 2) return false;
  const [start, end] = window.days;
  if (start <= end) return day >= start && day <= end;
  // Wrap: e.g., start=28 end=1 → day 28 or day 1
  return day >= start || day <= end;
}

export function isPackAvailableOnDay(pack, day) {
  if (day == null) return true; // no anchor → don't filter
  const rec = pack?.recurrence;
  if (!rec || !rec.windows || rec.windows.length === 0) return true;
  const cd = rec.cycleDays || DEFAULT_CYCLE_DAYS;
  return rec.windows.some(w => isDayInWindow(day, w, cd));
}
