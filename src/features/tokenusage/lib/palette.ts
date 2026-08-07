/**
 * Chart palette for the administrative token-usage dashboard.
 *
 * Every value here is a documented step of the dataviz skill's reference ramps —
 * nothing was eyeballed, nothing was hand-mixed. The palette was run through the
 * skill's validator against THIS application's real chart surfaces (from
 * `apps/web/src/app/globals.css`: light `oklch(1 0 0)` = `#ffffff`, dark
 * `oklch(0.145 0 0)` = `#0a0a0a`) in both modes. The verbatim output is below.
 *
 * Light and dark are two SELECTED sets of steps, chosen for their own surface —
 * never one set with its lightness flipped at runtime. Consumers pick a set from
 * the resolved theme (`seriesColor(i, mode)` / `sequentialColor(i, mode)`).
 *
 * ---------------------------------------------------------------------------
 * VALIDATOR OUTPUT — dataviz `scripts/validate_palette.js`, run 2026-08-07
 * ---------------------------------------------------------------------------
 *
 * $ node scripts/validate_palette.js "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4,#008300,#4a3aa7" --mode light --surface "#ffffff"
 *
 * Palette (light, surface #ffffff, categorical): 7 slots
 *   [PASS] Lightness band         all 7 inside L 0.43–0.77
 *   [PASS] Chroma floor           all 7 >= 0.1
 *   [PASS] CVD separation         worst adjacent #eda100↔#1baf7a ΔE 9.1 (protan) · tritan 5.8
 *   [PASS] Normal-vision floor    worst adjacent #e87ba4↔#eda100 ΔE 19.6 (normal)
 *   [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#1baf7a",2.82],["#eda100",2.17],["#e87ba4",2.69]]
 *
 *   → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
 *   scope: categorical palettes only. For a lone status/text color check WCAG text contrast; for a sequential ramp, lightness monotonicity.
 *
 * $ node scripts/validate_palette.js "#3987e5,#d95926,#199e70,#c98500,#d55181,#008300,#9085e9" --mode dark --surface "#0a0a0a"
 *
 * Palette (dark, surface #0a0a0a, categorical): 7 slots
 *   [PASS] Lightness band         all 7 inside L 0.48–0.67
 *   [PASS] Chroma floor           all 7 >= 0.1
 *   [PASS] CVD separation         worst adjacent #c98500↔#199e70 ΔE 8.4 (protan) · tritan 8.7
 *   [PASS] Normal-vision floor    worst adjacent #d55181↔#c98500 ΔE 19.3 (normal)
 *   [PASS] Contrast vs surface    all 7 >= 3:1
 *
 *   → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
 *   scope: categorical palettes only. For a lone status/text color check WCAG text contrast; for a sequential ramp, lightness monotonicity.
 *
 * $ node scripts/validate_palette.js "#104281,#1c5cab,#2a78d6,#5598e7,#86b6ef" --mode light --surface "#ffffff" --ordinal
 *
 * Palette (light, surface #ffffff, ordinal ramp): 5 slots
 *   [PASS] Lightness monotone     steps read light→dark
 *   [PASS] Adjacent ΔL            all gaps >= 0.06
 *   [PASS] Light-end contrast     #86b6ef at 2.11:1 vs surface
 *   [PASS] Single hue             hue spread 3°
 *
 *   → ALL CHECKS PASS  (ordinal: one hue, monotone L, visible step gaps, light end clears surface)
 *
 * $ node scripts/validate_palette.js "#9ec5f4,#6da7ec,#3987e5,#256abf,#184f95" --mode dark --surface "#0a0a0a" --ordinal
 *
 * Palette (dark, surface #0a0a0a, ordinal ramp): 5 slots
 *   [PASS] Lightness monotone     steps read light→dark
 *   [PASS] Adjacent ΔL            all gaps >= 0.06
 *   [PASS] Light-end contrast     #184f95 at 2.44:1 vs surface
 *   [PASS] Single hue             hue spread 3°
 *
 *   → ALL CHECKS PASS  (ordinal: one hue, monotone L, visible step gaps, light end clears surface)
 *
 * OTHER_COLOR is achromatic, so the categorical checks (which gate hue identity)
 * do not apply to it; it was gated on contrast alone with the validator's own
 * `contrast()` export: 3.59:1 on `#ffffff`, 5.51:1 on `#0a0a0a` — both clear 3:1.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE RESULTS OBLIGE US TO DO
 * ---------------------------------------------------------------------------
 *
 * - The light-mode contrast WARN is NOT dismissable. Three slots (aqua, yellow,
 *   magenta) sit below 3:1 on white, so every surface that paints with this
 *   palette MUST ship the relief channel: a visible legend, direct labels and a
 *   tooltip carrying the value in text. The timeline chart and the breakdown
 *   table both do.
 * - CVD separation is measured on ADJACENT pairs, which is the correct pairlist
 *   for stacked bars, grouped bars and lines — the only forms this palette paints.
 *   A scatter / bubble / small-multiples chart would need `--pairs all`, which
 *   caps the usable slot count at three; do not reuse this array there without
 *   re-running the validator with that flag.
 */

/** Which surface the colours are being painted on. */
export type ChartMode = "light" | "dark";

/** The chart surfaces the palette was validated against (globals.css). */
export const CHART_SURFACE: Readonly<Record<ChartMode, string>> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

/**
 * Categorical slots, in FIXED order. Slot n is series n — the order is the
 * CVD-safety mechanism, not decoration, so it is never re-ordered and never
 * cycled. The two-series default (customer / platform) takes slots 0 and 1.
 *
 * Hues, in order: blue, orange, aqua, yellow, magenta, green, violet.
 */
const CATEGORICAL_LIGHT: readonly string[] = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
];

/** The same seven hues, re-stepped for the dark surface. Not a lightness flip. */
const CATEGORICAL_DARK: readonly string[] = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
];

/**
 * The default (light-surface) categorical set.
 *
 * Prefer `seriesColor(index, mode)` — this array exists for consumers that only
 * need the documented default order.
 */
export const CATEGORICAL: readonly string[] = CATEGORICAL_LIGHT;

/**
 * How many series may carry their own identity hue. An 8th series is NEVER a
 * generated hue: it folds into `other`.
 */
export const CATEGORICAL_CEILING = CATEGORICAL_LIGHT.length;

/**
 * The "other" rollup colour: deliberately achromatic so it reads as "not an
 * identity" beside the seven hues. Same step in both modes — it clears 3:1 on
 * both surfaces (3.59:1 light, 5.51:1 dark).
 */
export const OTHER_COLOR = "#898781";

/**
 * Sequential (single-hue, blue) ramp for MAGNITUDE, indexed by rank position:
 * index 0 is rank 1 — the largest value — so the strongest step leads.
 *
 * On the light surface "strongest" is the darkest step; on the dark surface it
 * is the lightest. The anchor flips with the surface, which is why there are two
 * selected sets rather than one array reversed at runtime.
 *
 * Five steps, not eight: with the adjacent-ΔL ≥ 0.06 gate and the ≥ 2:1
 * surface-contrast gate on the step nearest the surface, the blue ramp fits
 * exactly five distinguishable steps. Consumers clamp past the end.
 */
const SEQUENTIAL_RAMP_LIGHT: readonly string[] = ["#104281", "#1c5cab", "#2a78d6", "#5598e7", "#86b6ef"];

const SEQUENTIAL_RAMP_DARK: readonly string[] = ["#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];

/**
 * The default (light-surface) sequential ramp.
 *
 * Prefer `sequentialColor(index, mode)` — this array exists for consumers that
 * only need the documented default.
 */
export const SEQUENTIAL_RAMP: readonly string[] = SEQUENTIAL_RAMP_LIGHT;

const categoricalSet = (mode: ChartMode): readonly string[] => (mode === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT);

const sequentialSet = (mode: ChartMode): readonly string[] =>
  mode === "dark" ? SEQUENTIAL_RAMP_DARK : SEQUENTIAL_RAMP_LIGHT;

/**
 * The identity colour for series `index`.
 *
 * Never generates a hue and never cycles: anything at or past the ceiling gets
 * `OTHER_COLOR`, because a series past the ceiling should already have been
 * folded into the "other" bucket by the caller.
 */
export function seriesColor(index: number, mode: ChartMode = "light"): string {
  if (index < 0 || index >= CATEGORICAL_CEILING) return OTHER_COLOR;
  return categoricalSet(mode)[index];
}

/**
 * Both mode steps for series `index`, shaped for a shadcn `ChartConfig` entry's
 * `theme` field.
 */
export function seriesTheme(index: number): { light: string; dark: string } {
  return { light: seriesColor(index, "light"), dark: seriesColor(index, "dark") };
}

/**
 * The magnitude colour for rank position `index`, clamped to the last step so a
 * long list keeps its weakest step rather than falling off the ramp.
 */
export function sequentialColor(index: number, mode: ChartMode = "light"): string {
  const ramp = sequentialSet(mode);
  const clamped = Math.min(Math.max(index, 0), ramp.length - 1);
  return ramp[clamped];
}
