// Server-safe subset of MDX_COMPONENTS used by `renderHelpArticle`.
// Mirrors `mdxComponents.ts` but EXCLUDES `Related` (which is a client
// component that uses `useHelp` + `usePageUrlGenerator`). Server-side rendering
// of `<Related>` would require passing the manifest by prop, which the standard
// MDX components map cannot do — articles that need related links should be
// extended via a server-side render hook rather than the MDX shortcode.

import { Callout } from "./Callout";
import { Steps, Step } from "./Steps";
import { Screenshot } from "./Screenshot";
import { EntityRef } from "./EntityRef";
import { KeyBinding } from "./KeyBinding";
import { Video } from "./Video";

export const MDX_SERVER_COMPONENTS = {
  Callout,
  Steps,
  Step,
  Screenshot,
  EntityRef,
  KeyBinding,
  Video,
} as const;
