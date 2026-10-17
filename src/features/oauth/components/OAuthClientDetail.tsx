"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw, Pencil, Trash2, ExternalLink } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shadcnui";
import { useI18nLocale } from "../../../i18n";
import { useOAuthScopeText } from "../hooks/useOAuthScopeText";
import { OAuthClientInterface } from "../interfaces/oauth.interface";

export interface OAuthClientDetailProps {
  /** The OAuth client to display */
  client: OAuthClientInterface;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Called when edit is clicked */
  onEdit?: () => void;
  /** Called when delete is clicked */
  onDelete?: () => Promise<void>;
  /** Called when regenerate secret is clicked */
  onRegenerateSecret?: () => Promise<void>;
}

/**
 * Detailed view of an OAuth client
 */
export function OAuthClientDetail({
  client,
  isLoading = false,
  onEdit,
  onDelete,
  onRegenerateSecret,
}: OAuthClientDetailProps) {
  const t = useTranslations();
  const locale = useI18nLocale();
  const scopeText = useOAuthScopeText();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [onDelete]);

  const handleRegenerateSecret = useCallback(async () => {
    if (!onRegenerateSecret) return;
    setIsRegenerating(true);
    try {
      await onRegenerateSecret();
    } finally {
      setIsRegenerating(false);
      setShowRegenerateConfirm(false);
    }
  }, [onRegenerateSecret]);

  const createdDate = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString(locale, { dateStyle: "long" })
    : t("oauth.ui.card.unknown");

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{client.name}</CardTitle>
              {client.description && <CardDescription className="mt-1">{client.description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={client.isActive ? "default" : "secondary"}>
                {client.isActive ? t("oauth.ui.card.active") : t("oauth.ui.card.inactive")}
              </Badge>
              <Badge variant="outline">
                {client.isConfidential ? t("oauth.ui.card.confidential") : t("oauth.ui.card.public")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client ID */}
          <div className="space-y-2">
            <Label>{t("oauth.ui.detail.client_id")}</Label>
            <div className="flex gap-2">
              <Input value={client.clientId} readOnly className="tabular-nums" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(client.clientId, "clientId")}
                title={t("oauth.ui.detail.copy_client_id")}
              >
                {copiedField === "clientId" ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label>{t("oauth.ui.detail.client_secret")}</Label>
            <div className="flex gap-2">
              <Input value="••••••••••••••••••••••••••••••••" readOnly className="tabular-nums" />
              {onRegenerateSecret && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowRegenerateConfirm(true)}
                  title={t("oauth.ui.detail.regenerate_secret")}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("oauth.ui.detail.regenerate_help")}</p>
          </div>

          <Separator />

          {/* Redirect URIs */}
          <div className="space-y-2">
            <Label>{t("oauth.ui.redirect_uris.label")}</Label>
            <ul className="space-y-1">
              {client.redirectUris.map((uri, index) => (
                <li key={index} className="flex items-center gap-2 text-sm tabular-nums">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  {uri}
                </li>
              ))}
            </ul>
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label>{t("oauth.ui.scope_selector.label")}</Label>
            <div className="flex flex-wrap gap-2">
              {client.allowedScopes.map((scope) => (
                <Badge key={scope} variant="secondary">
                  {scopeText(scope).name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Grant Types */}
          <div className="space-y-2">
            <Label>{t("oauth.ui.detail.grant_types")}</Label>
            <div className="flex flex-wrap gap-2">
              {client.allowedGrantTypes.map((grant) => (
                <Badge key={grant} variant="outline">
                  {grant.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>{t("oauth.ui.detail.created", { date: createdDate })}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onEdit && (
              <Button variant="outline" onClick={onEdit} disabled={isLoading}>
                <Pencil className="h-4 w-4 me-2" />
                {t("ui.buttons.edit")}
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isLoading}>
                <Trash2 className="h-4 w-4 me-2" />
                {t("ui.buttons.delete")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("oauth.settings.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("oauth.settings.delete_description", { name: client.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("ui.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("oauth.ui.detail.deleting") : t("ui.buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("oauth.ui.detail.regenerate_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("oauth.ui.detail.regenerate_description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegenerating}>{t("ui.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateSecret} disabled={isRegenerating}>
              {isRegenerating ? t("oauth.ui.detail.regenerating") : t("oauth.ui.detail.regenerate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
