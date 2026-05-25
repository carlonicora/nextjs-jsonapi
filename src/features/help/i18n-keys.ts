/**
 * The fixed namespace of i18n keys this feature reads via useTranslations/getTranslations.
 * Consuming apps must define each entry in their messages/<locale>.json.
 */
export const HELP_I18N_KEYS = [
  "help.modes.tutorial",
  "help.modes.how-to",
  "help.modes.reference",
  "help.modes.explanation",
  "help.sideNav.filterPlaceholder",
  "help.sideNav.noMatches",
  "help.toc.title",
  "help.article.lastUpdated",
  "help.article.previous",
  "help.article.next",
  "help.article.related",
  "help.askAi.button",
  "help.askAi.loginPrompt",
  "help.askAi.loginCta",
  "help.header.search",
  "help.header.login",
  "help.header.openApp",
  "help.hint.trigger",
  "help.hint.viewArticle",
  "help.hint.pickArticle",
  "help.landing.heading",
  "help.landing.subheading",
  "help.landing.featuredTutorials",
  "help.landing.browseByMode",
  "help.modeIndex.empty",
  "help.search.removed",
  "help.footerLink",
] as const;
