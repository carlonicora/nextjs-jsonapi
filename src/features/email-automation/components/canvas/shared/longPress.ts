export const LONG_PRESS_MS = 500;
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

/**
 * Touch long-press detector for canvas nodes. A finger held still for
 * LONG_PRESS_MS on a node fires `onLongPress` with the press point; any move
 * beyond the tolerance (a pan or a node drag), a lift or a cancel aborts it.
 * After a fired press, `consumeClick()` returns true once, so the caller can
 * swallow the click that the finger lift produces.
 */
export function createLongPressTracker(params: {
  onLongPress: (press: { target: string; clientX: number; clientY: number }) => void;
  delayMs?: number;
  moveTolerancePx?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}) {
  const delay = params.delayMs ?? LONG_PRESS_MS;
  const tolerance = params.moveTolerancePx ?? LONG_PRESS_MOVE_TOLERANCE_PX;
  const setTimer = params.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = params.clearTimer ?? ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  let timer: unknown = null;
  let start: { x: number; y: number } | null = null;
  let fired = false;

  const cancel = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    start = null;
  };

  return {
    down(target: string, clientX: number, clientY: number) {
      cancel();
      fired = false;
      start = { x: clientX, y: clientY };
      timer = setTimer(() => {
        timer = null;
        start = null;
        fired = true;
        params.onLongPress({ target, clientX, clientY });
      }, delay);
    },
    move(clientX: number, clientY: number) {
      if (!start) return;
      if (Math.hypot(clientX - start.x, clientY - start.y) > tolerance) cancel();
    },
    up: cancel,
    cancel,
    consumeClick(): boolean {
      const wasFired = fired;
      fired = false;
      return wasFired;
    },
  };
}
