import { describe, expect, it } from "vitest";
import { nextDateRange } from "../DateRangeSelector";

// The dates below mirror the component's own default range: the whole current
// month. "Today" is irrelevant to nextDateRange() — only the shape of the range
// matters — so fixed dates are used rather than a faked clock.
const AUG_1 = new Date(2026, 7, 1);
const AUG_10 = new Date(2026, 7, 10);
const AUG_20 = new Date(2026, 7, 20);
const AUG_31 = new Date(2026, 7, 31);
const JUL_10 = new Date(2026, 6, 10);

const CURRENT_MONTH = { from: AUG_1, to: AUG_31 };

describe("nextDateRange", () => {
  // The reported bug: with the default (complete) current-month range, every
  // click in the current month lands AFTER `from`, so react-day-picker returns
  // { from: AUG_1, to: clicked } and `from` never moves. The selector must read
  // that as "start a new range at the clicked day", not "move the end".
  it("starts a new range when a complete range is clicked inside the current month", () => {
    expect(
      nextDateRange({
        current: CURRENT_MONTH,
        computed: { from: AUG_1, to: AUG_10 }, // what addToRange returns
        triggerDate: AUG_10,
      }),
    ).toEqual({ from: AUG_10, to: undefined });
  });

  // The half that always worked, and which must keep working: a click BEFORE
  // `from` does move `from`, so react-day-picker returns { from: clicked, to }.
  // Same outcome either way — the clicked day becomes the new start.
  it("starts a new range when a complete range is clicked in a past month", () => {
    expect(
      nextDateRange({
        current: CURRENT_MONTH,
        computed: { from: JUL_10, to: AUG_31 },
        triggerDate: JUL_10,
      }),
    ).toEqual({ from: JUL_10, to: undefined });
  });

  it("completes an in-progress range with the second click", () => {
    expect(
      nextDateRange({
        current: { from: AUG_10, to: undefined },
        computed: { from: AUG_10, to: AUG_20 },
        triggerDate: AUG_20,
      }),
    ).toEqual({ from: AUG_10, to: AUG_20 });
  });

  it("keeps react-day-picker's swap when the second click precedes the start", () => {
    expect(
      nextDateRange({
        current: { from: AUG_20, to: undefined },
        computed: { from: AUG_10, to: AUG_20 },
        triggerDate: AUG_10,
      }),
    ).toEqual({ from: AUG_10, to: AUG_20 });
  });

  it("opens a range from the empty state", () => {
    expect(
      nextDateRange({ current: undefined, computed: { from: AUG_10, to: AUG_10 }, triggerDate: AUG_10 }),
    ).toEqual({ from: AUG_10, to: AUG_10 });
  });

  // react-day-picker returns undefined to DESELECT; that must survive the
  // complete-range branch rather than being turned into a new start.
  it("clears when react-day-picker deselects", () => {
    expect(nextDateRange({ current: { from: AUG_10, to: AUG_10 }, computed: undefined, triggerDate: AUG_10 })).toBeUndefined();
  });
});
