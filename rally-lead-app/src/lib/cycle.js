// Cycle math. Days roll over at UTC midnight.
//
// Kingdom #1650 anchors (hardcoded for now — future multi-kingdom support
// would store these per kingdom):
//   server day 1     = 2026-02-07 UTC
//   cycle day 1 ref  = 2026-04-27 UTC  (any past or future cycle-day-1 works;
//                                        modular math handles either)
//
// Cross-check on 2026-05-13: 95 days after 2026-02-07 → server day 96;
// 16 days after 2026-04-27 → cycle day 17.

const MS_PER_DAY = 86_400_000;
const DEFAULT_CYCLE_DAYS = 28;

export const KINGDOM_1650_CYCLE_ANCHOR = "2026-04-27T00:00:00Z";
export const KINGDOM_1650_SERVER_DAY_1 = "2026-02-07T00:00:00Z";

// Returns 1..cycleDays. Pass a non-default cycleAnchor only if you're
// modeling a kingdom whose rotation is offset from Kingdom 1650's.
export function dayOfCycle(
  cycleAnchor = KINGDOM_1650_CYCLE_ANCHOR,
  now = new Date(),
  cycleDays = DEFAULT_CYCLE_DAYS,
) {
  if (!cycleAnchor) return null;
  const anchor = new Date(cycleAnchor);
  if (isNaN(anchor.getTime())) return null;
  const elapsed = Math.floor((now.getTime() - anchor.getTime()) / MS_PER_DAY);
  return (((elapsed % cycleDays) + cycleDays) % cycleDays) + 1;
}

// Returns 1+ (1 on launch day). Null if the launch date is invalid.
export function serverDay(now = new Date(), launchDate = KINGDOM_1650_SERVER_DAY_1) {
  const start = new Date(launchDate);
  if (isNaN(start.getTime())) return null;
  return Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

// Is day-of-cycle `day` inside this window? Handles wrap-around windows
// (e.g., Combat Medic Days 28→1).
export function isDayInWindow(day, window, cycleDays = DEFAULT_CYCLE_DAYS) {
  if (!window || !Array.isArray(window.days) || window.days.length !== 2) return false;
  const [start, end] = window.days;
  if (start <= end) return day >= start && day <= end;
  return day >= start || day <= end;
}

export function isPackAvailableOnDay(pack, day) {
  if (day == null) return true;
  const rec = pack?.recurrence;
  if (!rec || !rec.windows || rec.windows.length === 0) return true;
  const cd = rec.cycleDays || DEFAULT_CYCLE_DAYS;
  return rec.windows.some(w => isDayInWindow(day, w, cd));
}
