"use client";

import {
  Eye,
  Pencil,
  Image,
  Upload,
  Film,
  FolderPlus,
  User,
  Shield,
  LucideIcon,
} from "lucide-react";
import { OAuthScopeInfo } from "../../interfaces/oauth.interface";

export interface OAuthScopeListProps {
  /** List of requested scopes */
  scopes: OAuthScopeInfo[];
}

/** Map scope icons to Lucide components */
const SCOPE_ICONS: Record<string, LucideIcon> = {
  eye: Eye,
  pencil: Pencil,
  image: Image,
  upload: Upload,
  film: Film,
  "folder-plus": FolderPlus,
  user: User,
  shield: Shield,
};

/**
 * List of requested OAuth scopes for consent display
 */
export function OAuthScopeList({ scopes }: OAuthScopeListProps) {
  if (scopes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        This will allow the application to:
      </h2>
      <ul className="space-y-3">
        {scopes.map((scope) => {
          const IconComponent = scope.icon ? SCOPE_ICONS[scope.icon] : Eye;

          return (
            <li
              key={scope.scope}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium">{scope.name}</p>
                <p className="text-sm text-muted-foreground">{scope.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
