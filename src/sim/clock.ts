/** Fixed-step simulation clock, decoupled from the render framerate. */

export type SimSpeed = 0 | 1 | 2 | 4;

/** One simulated tick = this many simulated milliseconds. Kept coarse enough
 * to be cheap, fine enough for smooth-looking press cycles (a few seconds). */
export const TICK_MS = 250;

export interface SimClockState {
  /** Total simulated time elapsed, in ms. */
  simTimeMs: number;
  /** Current in-game day (0-based), derived from simTimeMs. */
  day: number;
  speed: SimSpeed;
  /** Real ms accumulated since the last consumed tick. */
  accumulatorMs: number;
}

export const DAY_LENGTH_MS = 24 * 60 * 60 * 1000 / 90; // 1 in-game day = 16 real minutes at x1

/** New games start at 7 AM so the default morning-shift hires are
 * immediately on the clock instead of the player staring at an idle floor. */
const START_HOUR = 7;

export function createClock(): SimClockState {
  return { simTimeMs: START_HOUR * (DAY_LENGTH_MS / 24), day: 0, speed: 1, accumulatorMs: 0 };
}

/** Advances the clock by realDeltaMs of wall-clock time, invoking `onTick` once
 * per fixed simulated step. Returns the number of ticks consumed (for callers
 * that want to cap catch-up work after e.g. a backgrounded tab). */
export function advanceClock(
  clock: SimClockState,
  realDeltaMs: number,
  onTick: (tickMs: number) => void,
  maxTicksPerFrame = 40,
): number {
  if (clock.speed === 0) return 0;
  clock.accumulatorMs += realDeltaMs * clock.speed;
  let ticks = 0;
  while (clock.accumulatorMs >= TICK_MS && ticks < maxTicksPerFrame) {
    clock.accumulatorMs -= TICK_MS;
    clock.simTimeMs += TICK_MS;
    clock.day = Math.floor(clock.simTimeMs / DAY_LENGTH_MS);
    onTick(TICK_MS);
    ticks++;
  }
  return ticks;
}

export function setSpeed(clock: SimClockState, speed: SimSpeed): void {
  clock.speed = speed;
  if (speed === 0) clock.accumulatorMs = 0;
}
