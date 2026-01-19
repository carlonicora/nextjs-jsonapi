"use client";

import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Label } from "../../../shadcnui";

export interface OAuthRedirectUriInputProps {
  /** Current array of redirect URIs */
  value: string[];
  /** Called when URIs change */
  onChange: (uris: string[]) => void;
  /** Error message to display */
  error?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Label text */
  label?: string;
}

/**
 * Validates a redirect URI
 * Allows: https://, http://localhost, custom schemes (myapp://)
 */
function isValidRedirectUri(uri: string): boolean {
  if (!uri.trim()) return false;

  // Allow localhost for development
  if (uri.startsWith("http://localhost") || uri.startsWith("http://127.0.0.1")) {
    return true;
  }

  // Require HTTPS for non-localhost
  if (uri.startsWith("https://")) {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  }

  // Allow custom schemes (e.g., myapp://oauth/callback)
  if (uri.includes("://")) {
    const schemeMatch = uri.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
    return schemeMatch !== null;
  }

  return false;
}

/**
 * Dynamic input for managing OAuth redirect URIs
 *
 * @example
 * ```tsx
 * const [redirectUris, setRedirectUris] = useState<string[]>(['']);
 *
 * <OAuthRedirectUriInput
 *   value={redirectUris}
 *   onChange={setRedirectUris}
 *   error={errors.redirectUris}
 * />
 * ```
 */
export function OAuthRedirectUriInput({
  value,
  onChange,
  error,
  disabled = false,
  label = "Redirect URIs",
}: OAuthRedirectUriInputProps) {
  const handleAdd = useCallback(() => {
    onChange([...value, ""]);
  }, [value, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const newUris = value.filter((_, i) => i !== index);
      // Keep at least one empty input
      onChange(newUris.length > 0 ? newUris : [""]);
    },
    [value, onChange],
  );

  const handleChange = useCallback(
    (index: number, newValue: string) => {
      const newUris = [...value];
      newUris[index] = newValue;
      onChange(newUris);
    },
    [value, onChange],
  );

  return (
    <div className="space-y-2">
      <Label>{label} *</Label>
      <p className="text-sm text-muted-foreground">
        Enter the URIs where users will be redirected after authorization. Use https:// for production, or custom
        schemes for mobile apps.
      </p>

      <div className="space-y-2">
        {value.map((uri, index) => {
          const isValid = !uri || isValidRedirectUri(uri);

          return (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={uri}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="https://example.com/callback or myapp://oauth"
                  disabled={disabled}
                  className={!isValid ? "border-destructive" : ""}
                />
                {!isValid && (
                  <p className="text-xs text-destructive mt-1">
                    Must be https://, http://localhost, or a custom scheme (app://)
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled || value.length === 1}
                title="Remove URI"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={disabled} className="mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Redirect URI
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
