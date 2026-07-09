"use client";

import { EditableAvatar } from "../EditableAvatar";
import { EntityAvatar } from "../EntityAvatar";
import { ModuleWithPermissions } from "../../permissions";
import { cn, getInitials } from "../../utils";

type EntityHeroAvatarProps = {
  module: ModuleWithPermissions;
  entityId: string;
  name: string;
  image?: string;
  patchImage?: (imageKey: string) => Promise<void>;
  /** Required when `patchImage` is set — namespaces the S3 upload key. */
  companyId?: string;
  variant?: "image" | "initials" | "icon";
  className?: string;
};

export function EntityHeroAvatar({
  module,
  entityId,
  name,
  image,
  patchImage,
  companyId,
  variant,
  className = "h-24 w-24",
}: EntityHeroAvatarProps) {
  const resolved = variant ?? (patchImage || image ? "image" : "icon");

  if (patchImage) {
    return (
      <EditableAvatar
        entityId={entityId}
        module={module}
        image={image}
        fallback={getInitials(name)}
        alt={name}
        patchImage={patchImage}
        companyId={companyId ?? ""}
        className={className}
        fallbackClassName="text-2xl"
      />
    );
  }

  if (resolved === "image" || resolved === "initials") {
    return <EntityAvatar image={resolved === "image" ? image : undefined} name={name} className={className} />;
  }

  const Icon = module.icon;
  // Not every module declares an icon; fall back to initials so the hero never
  // renders an empty circle.
  if (!Icon) {
    return <EntityAvatar name={name} className={className} />;
  }
  return (
    <div className={cn("bg-muted flex shrink-0 items-center justify-center rounded-full", className)}>
      <Icon className="text-primary h-10 w-10" />
    </div>
  );
}
