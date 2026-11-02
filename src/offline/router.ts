import type { OfflineMethod, OfflineRoute, PatternSegment } from "./types";

export type RouteMatch = { route: OfflineRoute; params: Record<string, string> };

function splitPath(path: string): string[] {
  const withoutQuery = path.split("?")[0].split("#")[0];
  return withoutQuery.split("/").filter((segment) => segment.length > 0);
}

/** A Module segment may itself hold slashes ("roots/played"), so each one is expanded. */
function expandPattern(pattern: PatternSegment[]): string[] {
  return pattern.flatMap((segment) => splitPath(typeof segment === "string" ? segment : segment.name));
}

export function matchPattern(pattern: PatternSegment[], path: string): Record<string, string> | null {
  const expected = expandPattern(pattern);
  const actual = splitPath(path);
  if (expected.length !== actual.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < expected.length; index++) {
    const segment = expected[index];
    const value = decodeURIComponent(actual[index]);
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = value;
    } else if (segment !== value) {
      return null;
    }
  }
  return params;
}

/** The first route, in the order given, whose method and pattern match. The query string is ignored. */
export function matchRoute(routes: OfflineRoute[], method: OfflineMethod, path: string): RouteMatch | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchPattern(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}
