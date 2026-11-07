// Widths, in rem, of what has to fit INSIDE the page card next to each other.
// Each value mirrors a class in RoundPageContainer — change them together.
const RAIL_REM = 14; // section rail `md:w-56`, only on `layout="rail"` pages
const CONTENT_PADDING_REM = 2; // `p-4` on both sides of the content column
const CONTENT_COLUMN_REM = 72; // `max-w-6xl`
const DETAILS_REM = 24; // details panel `w-96`
const DETAILS_BORDER_PX = 1; // details panel `border-s`

/**
 * Whether the details panel fits beside the page's centred content column
 * without squeezing it. Used only as the default when the user has never
 * toggled the panel on this module.
 *
 * `cardInnerPx` is the measured inner width of the page card, so whatever sits
 * outside it — the left sidebar open, minimised to icons or absent, the shell
 * margins — is already accounted for.
 *
 * Pages without a centred column (`fullWidth`, or a full-bleed fill-height tab)
 * have nothing to protect, so they return `false` and keep the closed default.
 */
export function detailsFitsByDefault(params: {
  cardInnerPx: number;
  remPx: number;
  hasRail: boolean;
  hasCentredColumn: boolean;
}): boolean {
  if (!params.hasCentredColumn) return false;
  const rem = (params.hasRail ? RAIL_REM : 0) + CONTENT_PADDING_REM + CONTENT_COLUMN_REM + DETAILS_REM;
  return params.cardInnerPx >= rem * params.remPx + DETAILS_BORDER_PX;
}
