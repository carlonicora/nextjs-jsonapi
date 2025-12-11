import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { ApiDataInterface, Modules } from "../core";
import { ContentInterface } from "../features/content/data/content.interface";
import { ModuleWithPermissions } from "../permissions";
import { cn } from "./cn";

export const getIconByModule = (params: { module: ModuleWithPermissions; className?: string }): ReactNode => {
  const IconComponent = getLucideIconByModule({ module: params.module });
  if (!IconComponent) return null;
  return <IconComponent className={cn(``, params.className)} />;
};

export const getIcon = (params: { element: ApiDataInterface; className?: string }): ReactNode => {
  const IconComponent = getLucideIcon({ element: params.element });
  if (!IconComponent) return null;
  return <IconComponent className={cn(``, params.className)} />;
};

export const getIconByModuleName = (params: { name: string; className?: string }): ReactNode => {
  return getIconByModule({ module: Modules.findByModelName(params.name), className: params.className });
};

export const getLucideIcon = (params: { element: ApiDataInterface }): LucideIcon | null => {
  if (params.element.type === "contents") {
    const contentType = (params.element as ContentInterface).contentType;
    if (!contentType) return null;
    return getLucideIconByModule({ module: Modules.findByModelName(contentType) });
  }

  return getLucideIconByModule({ module: Modules.findByName(params.element.type) });
};

export const getLucideIconByModule = (params: { module: ModuleWithPermissions }): LucideIcon | null => {
  return params.module.icon ?? null;
};

export const getLucideIconByModuleName = (params: { name: string }): LucideIcon | null => {
  return getLucideIconByModule({ module: Modules.findByModelName(params.name) });
};
