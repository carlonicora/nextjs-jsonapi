"use client";

import { useState, useCallback } from "react";
import {
  Button,
  Input,
  Label,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../shadcnui";
import { OAuthRedirectUriInput } from "./OAuthRedirectUriInput";
import { OAuthScopeSelector } from "./OAuthScopeSelector";
import { OAuthClientCreateRequest, OAuthClientInterface, DEFAULT_GRANT_TYPES } from "../interfaces/oauth.interface";

export interface OAuthClientFormProps {
  /** Existing client for edit mode (undefined = create mode) */
  client?: OAuthClientInterface;
  /** Called on form submit */
  onSubmit: (data: OAuthClientCreateRequest) => Promise<void>;
  /** Called on cancel */
  onCancel: () => void;
  /** Whether form is submitting */
  isLoading?: boolean;
}

interface FormState {
  name: string;
  description: string;
  redirectUris: string[];
  allowedScopes: string[];
  isConfidential: boolean;
}

interface FormErrors {
  name?: string;
  redirectUris?: string;
  allowedScopes?: string;
}

/**
 * Form for creating or editing an OAuth client
 */
export function OAuthClientForm({ client, onSubmit, onCancel, isLoading = false }: OAuthClientFormProps) {
  const isEditMode = !!client;

  const [formState, setFormState] = useState<FormState>({
    name: client?.name || "",
    description: client?.description || "",
    redirectUris: client?.redirectUris?.length ? client.redirectUris : [""],
    allowedScopes: client?.allowedScopes || [],
    isConfidential: client?.isConfidential ?? true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.name.trim()) {
      newErrors.name = "Application name is required";
    }

    const validUris = formState.redirectUris.filter((uri) => uri.trim());
    if (validUris.length === 0) {
      newErrors.redirectUris = "At least one redirect URI is required";
    }

    if (formState.allowedScopes.length === 0) {
      newErrors.allowedScopes = "At least one scope must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      const data: OAuthClientCreateRequest = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        redirectUris: formState.redirectUris.filter((uri) => uri.trim()),
        allowedScopes: formState.allowedScopes,
        allowedGrantTypes: DEFAULT_GRANT_TYPES,
        isConfidential: formState.isConfidential,
      };

      await onSubmit(data);
    },
    [formState, validate, onSubmit],
  );

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Application" : "Create OAuth Application"}</CardTitle>
          <CardDescription>
            {isEditMode ? "Update your OAuth application settings." : "Register a new application to access the API."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Application Name *</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
              placeholder="My Lightroom Plugin"
              disabled={isLoading}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
              placeholder="A brief description of your application"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Redirect URIs */}
          <OAuthRedirectUriInput
            value={formState.redirectUris}
            onChange={(uris) => setFormState((s) => ({ ...s, redirectUris: uris }))}
            error={errors.redirectUris}
            disabled={isLoading}
          />

          {/* Scopes */}
          <OAuthScopeSelector
            value={formState.allowedScopes}
            onChange={(scopes) => setFormState((s) => ({ ...s, allowedScopes: scopes }))}
            error={errors.allowedScopes}
            disabled={isLoading}
          />

          {/* Client Type */}
          <div className="space-y-3">
            <Label>Client Type</Label>
            <RadioGroup
              value={formState.isConfidential ? "confidential" : "public"}
              onValueChange={(v) => setFormState((s) => ({ ...s, isConfidential: v === "confidential" }))}
              disabled={isLoading || isEditMode}
            >
              <div className="flex items-start space-x-3 p-3 rounded-md border">
                <RadioGroupItem value="confidential" id="confidential" className="mt-1" />
                <div>
                  <Label htmlFor="confidential" className="font-medium cursor-pointer">
                    Confidential
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Server-side application that can securely store the client secret.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-md border">
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div>
                  <Label htmlFor="public" className="font-medium cursor-pointer">
                    Public
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mobile or desktop application. Requires PKCE for authorization.
                  </p>
                </div>
              </div>
            </RadioGroup>
            {isEditMode && (
              <p className="text-sm text-muted-foreground">Client type cannot be changed after creation.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Create Application"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
