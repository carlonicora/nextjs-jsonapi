"use client";

import { useTranslations } from "next-intl";
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
import {
  OAuthClientCreateRequest,
  OAuthClientInterface,
  OAuthScopeInfo,
  DEFAULT_GRANT_TYPES,
} from "../interfaces/oauth.interface";

export interface OAuthClientFormProps {
  /** Existing client for edit mode (undefined = create mode) */
  client?: OAuthClientInterface;
  /** Called on form submit */
  onSubmit: (data: OAuthClientCreateRequest) => Promise<void>;
  /** Called on cancel */
  onCancel: () => void;
  /** Whether form is submitting */
  isLoading?: boolean;
  /** Scopes the app offers in the selector (defaults to AVAILABLE_OAUTH_SCOPES) */
  availableScopes?: OAuthScopeInfo[];
  /** Scopes preselected in create mode (edit mode uses client.allowedScopes) */
  defaultScopes?: string[];
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
export function OAuthClientForm({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
  availableScopes,
  defaultScopes = [],
}: OAuthClientFormProps) {
  const t = useTranslations();
  const isEditMode = !!client;

  const [formState, setFormState] = useState<FormState>({
    name: client?.name || "",
    description: client?.description || "",
    redirectUris: client?.redirectUris?.length ? client.redirectUris : [""],
    allowedScopes: client ? client.allowedScopes || [] : defaultScopes,
    isConfidential: client?.isConfidential ?? true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.name.trim()) {
      newErrors.name = t("oauth.ui.form.errors.name_required");
    }

    const validUris = formState.redirectUris.filter((uri) => uri.trim());
    if (validUris.length === 0) {
      newErrors.redirectUris = t("oauth.ui.form.errors.redirect_uri_required");
    }

    if (formState.allowedScopes.length === 0) {
      newErrors.allowedScopes = t("oauth.ui.form.errors.scope_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState, t]);

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
          <CardTitle>{isEditMode ? t("oauth.ui.form.edit_title") : t("oauth.settings.create_title")}</CardTitle>
          <CardDescription>
            {isEditMode ? t("oauth.ui.form.edit_description") : t("oauth.ui.form.create_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("oauth.ui.form.name")} *</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
              placeholder={t("oauth.ui.form.name_placeholder")}
              disabled={isLoading}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-destructive text-xs/relaxed">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("oauth.ui.form.description")}</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
              placeholder={t("oauth.ui.form.description_placeholder")}
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
            availableScopes={availableScopes}
            error={errors.allowedScopes}
            disabled={isLoading}
          />

          {/* Client Type */}
          <div className="space-y-3">
            <Label>{t("oauth.ui.form.client_type")}</Label>
            <RadioGroup
              value={formState.isConfidential ? "confidential" : "public"}
              onValueChange={(v) => setFormState((s) => ({ ...s, isConfidential: v === "confidential" }))}
              disabled={isLoading || isEditMode}
            >
              <div className="flex items-start space-x-3 p-3 rounded-md border">
                <RadioGroupItem value="confidential" id="confidential" className="mt-1" />
                <div>
                  <Label htmlFor="confidential" className="cursor-pointer">
                    {t("oauth.ui.card.confidential")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("oauth.ui.form.confidential_help")}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-md border">
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div>
                  <Label htmlFor="public" className="cursor-pointer">
                    {t("oauth.ui.card.public")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("oauth.ui.form.public_help")}</p>
                </div>
              </div>
            </RadioGroup>
            {isEditMode && <p className="text-sm text-muted-foreground">{t("oauth.ui.form.client_type_locked")}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t("ui.buttons.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("oauth.ui.form.saving")
              : isEditMode
                ? t("oauth.ui.form.save_changes")
                : t("oauth.ui.list.create")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
