import { describe, it, expect } from "vitest";
import * as path from "path";
import { makeFrontendData } from "./fixtures";
import { generateLoadingTemplate } from "../templates/pages/loading.template";
import { generateListPageTemplate } from "../templates/pages/list-page.template";
import { generateDetailPageTemplate } from "../templates/pages/detail-page.template";
import { buildFilePaths } from "../transformers/import-resolver";

describe("loading template", () => {
  it("renders PageSkeleton verbatim, matching the app convention", () => {
    expect(generateLoadingTemplate()).toBe(
      `import { PageSkeleton } from "@/features/common/components/skeletons/PageSkeleton";

export default function Loading() {
  return <PageSkeleton />;
}
`,
    );
  });

  it("places a loading.tsx next to every generated page.tsx", () => {
    const paths = buildFilePaths(makeFrontendData(), "/repo");
    expect(paths.listLoading).toBe(path.join(path.dirname(paths.listPage), "loading.tsx"));
    expect(paths.detailLoading).toBe(path.join(path.dirname(paths.detailPage), "loading.tsx"));
    expect(paths.listLoading).toBe("/repo/apps/web/src/app/[locale]/(main)/(features)/widgets/loading.tsx");
    expect(paths.detailLoading).toBe("/repo/apps/web/src/app/[locale]/(main)/(features)/widgets/[id]/loading.tsx");
  });

  it("both generated pages await data, so both segments need a loading file", () => {
    const data = makeFrontendData();
    expect(generateListPageTemplate(data)).toMatch(/export default async function[\s\S]*await /);
    expect(generateDetailPageTemplate(data)).toMatch(/export default async function[\s\S]*await /);
  });
});
