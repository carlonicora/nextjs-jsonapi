import { ModuleFactory } from "../../permissions";
import { AiConnection } from "./data";

export const AiConnectionModule = (factory: ModuleFactory) =>
  factory({
    name: "ai-connections",
    // The administration route this entity is served at. `name` above stays the
    // API endpoint; this drives generateUrl / rewriteUrl / EditorSheet
    // navigation, so it must match the real Next.js route or RoundPageContainer
    // rewrites the URL to a 404 on the first tab change.
    pageUrl: "/administration/ai-connections",
    model: AiConnection,
    moduleId: "7d3f2b8a-91c4-4e6d-a5f0-2c9b8e4d1a37",
  });
