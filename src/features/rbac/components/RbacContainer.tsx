"use client";

import { RoundPageContainer } from "@/components";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { RbacService } from "../data/RbacService";
import { useRbacState } from "../hooks/useRbacState";
import { downloadMigrationFile, generateMigrationFile } from "../utils/RbacMigrationGenerator";
import RbacFeatureSection from "./RbacFeatureSection";
import RbacToolbar from "./RbacToolbar";

export default function RbacContainer() {
  const t = useTranslations();
  const stateApi = useRbacState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [features, roles, permissionMappings, modulePaths] = await Promise.all([
          RbacService.getFeatures(),
          RbacService.getRoles(),
          RbacService.getPermissionMappings(),
          RbacService.getModuleRelationshipPaths(),
        ]);
        stateApi.init(features, roles, permissionMappings, modulePaths);
      } catch (err) {
        console.error("Failed to load RBAC configuration:", err);
        setError(t("rbac.loading_error"));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [t]);

  const handleGenerate = useCallback(() => {
    const effective = stateApi.getEffectiveConfiguration();
    if (!effective) return;

    const content = generateMigrationFile({
      features: effective.features,
      roles: effective.roles,
      rolePermissionsMap: effective.rolePermissionsMap,
    });

    downloadMigrationFile(content);
  }, [stateApi]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!stateApi.original) return null;

  return (
    <RoundPageContainer>
      <RbacToolbar isDirty={stateApi.isDirty} onGenerate={handleGenerate} onReset={stateApi.reset} />

      {stateApi.original.features.map((feature) => (
        <RbacFeatureSection key={feature.id} feature={feature} roles={stateApi.original!.roles} stateApi={stateApi} />
      ))}
    </RoundPageContainer>
  );
}

export { RbacContainer };
