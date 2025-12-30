/**
 * Settings Module Page Template
 *
 * Generates module-specific settings page with module selection
 */

import * as fs from "fs";
import * as path from "path";

export function generateSettingsModulePageTemplate(webBasePath: string): string | null {
  const outputPath = path.join(webBasePath, "apps/web/src/app/[locale]/(main)/(features)/settings/[module]/page.tsx");

  if (fs.existsSync(outputPath)) {
    return null; // Skip if exists
  }

  return `import SettingsContainer from "@/features/common/components/containers/SettingsContainer";
import { SettingsProvider } from "@/features/common/contexts/SettingsContext";
import { generateSpecificMetadata } from "@/utils/metadata";
import { PageContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  const title = t(\`generic.settings\`);

  return await generateSpecificMetadata({ title: title });
}

export default async function SettingsModulePage(props: {
  params: Promise<{ module: string }>;
}) {
  const params = await props.params;
  return (
    <SettingsProvider moduleName={params.module}>
      <PageContainer>
        <SettingsContainer />
      </PageContainer>
    </SettingsProvider>
  );
}
`;
}
