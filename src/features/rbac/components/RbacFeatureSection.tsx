"use client";

import { cn } from "../../../lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../shadcnui";
import { Switch } from "../../../shadcnui";
import { FeatureInterface } from "../../feature";
import { RoleInterface } from "../../role";
import { RbacStateApi } from "../hooks/useRbacState";
import RbacModuleTable from "./RbacModuleTable";

interface RbacFeatureSectionProps {
  feature: FeatureInterface;
  roles: RoleInterface[];
  stateApi: RbacStateApi;
}

export default function RbacFeatureSection({ feature, roles, stateApi }: RbacFeatureSectionProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(true);
  const featureIsCore = stateApi.getFeatureIsCore(feature.id);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        {/* Feature header */}
        <CollapsibleTrigger className="w-full">
          <div className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <ChevronDownIcon
                className={cn("h-4 w-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")}
              />
              <h3 className="text-base font-semibold">{feature.name}</h3>
              <span className="text-xs text-muted-foreground">
                {t("rbac.module_count", { count: feature.modules.length })}
              </span>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-muted-foreground">{t("rbac.core")}</span>
              <Switch
                checked={featureIsCore}
                onCheckedChange={(checked) => stateApi.setFeatureIsCore(feature.id, checked)}
                className="data-checked:bg-accent data-unchecked:bg-gray-300"
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-3 p-4 pt-0">
            {feature.modules.map((mod) => (
              <RbacModuleTable key={mod.id} module={mod} roles={roles} stateApi={stateApi} />
            ))}
            {feature.modules.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4 text-center">{t("rbac.no_modules")}</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { RbacFeatureSection };
