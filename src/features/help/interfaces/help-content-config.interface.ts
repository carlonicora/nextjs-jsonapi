export interface HelpBrandConfig {
  /** URL of the brand logo image (served by the consuming app). */
  logo?: string;
  /** Brand label shown in the help header. */
  label?: string;
  /** Where the "Open app" button navigates for logged-in users. Defaults to "/". */
  appHref?: string;
}

export interface HelpContentConfig {
  brand?: HelpBrandConfig;
}
