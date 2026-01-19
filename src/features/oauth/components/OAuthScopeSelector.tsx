"use client";

import { useCallback } from "react";
import { Checkbox, Label } from "../../../shadcnui";
import { AVAILABLE_OAUTH_SCOPES, OAuthScopeInfo } from "../interfaces/oauth.interface";

export interface OAuthScopeSelectorProps {
  /** Currently selected scopes */
  value: string[];
  /** Called when selection changes */
  onChange: (scopes: string[]) => void;
  /** Available scopes to display (defaults to all) */
  availableScopes?: OAuthScopeInfo[];
  /** Whether selector is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Label text */
  label?: string;
}

/**
 * Checkbox selector for OAuth scopes
 *
 * @example
 * ```tsx
 * const [scopes, setScopes] = useState<string[]>([]);
 *
 * <OAuthScopeSelector
 *   value={scopes}
 *   onChange={setScopes}
 *   error={errors.scopes}
 * />
 * ```
 */
export function OAuthScopeSelector({
  value,
  onChange,
  availableScopes = AVAILABLE_OAUTH_SCOPES,
  disabled = false,
  error,
  label = "Allowed Scopes",
}: OAuthScopeSelectorProps) {
  const handleToggle = useCallback(
    (scope: string, checked: boolean) => {
      if (checked) {
        onChange([...value, scope]);
      } else {
        onChange(value.filter((s) => s !== scope));
      }
    },
    [value, onChange],
  );

  // Group scopes by category (before the colon)
  const groupedScopes = availableScopes.reduce(
    (acc, scope) => {
      const [category] = scope.scope.split(":");
      const groupName = category === scope.scope ? "General" : category;

      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(scope);
      return acc;
    },
    {} as Record<string, OAuthScopeInfo[]>,
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>{label} *</Label>
        <p className="text-sm text-muted-foreground">Select the permissions your application needs.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedScopes).map(([groupName, scopes]) => (
          <div key={groupName} className="space-y-2">
            <h4 className="text-sm font-medium capitalize">{groupName}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
              {scopes.map((scopeInfo) => {
                const isChecked = value.includes(scopeInfo.scope);
                const isAdmin = scopeInfo.scope === "admin";

                return (
                  <div
                    key={scopeInfo.scope}
                    className={`flex items-start space-x-3 p-2 rounded-md border ${
                      isChecked ? "bg-primary/5 border-primary/20" : "border-transparent"
                    } ${isAdmin ? "bg-destructive/5" : ""}`}
                  >
                    <Checkbox
                      id={`scope-${scopeInfo.scope}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleToggle(scopeInfo.scope, checked === true)}
                      disabled={disabled}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`scope-${scopeInfo.scope}`} className="text-sm font-medium cursor-pointer">
                        {scopeInfo.name}
                        {isAdmin && <span className="ml-2 text-xs text-destructive">(Dangerous)</span>}
                      </Label>
                      <p className="text-xs text-muted-foreground">{scopeInfo.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
