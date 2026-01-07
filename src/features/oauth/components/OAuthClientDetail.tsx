"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
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
import { OAuthClientInterface, OAUTH_SCOPE_DISPLAY } from "../interfaces/oauth.interface";

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
    ? format(new Date(client.createdAt), "MMMM d, yyyy")
    : "Unknown";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{client.name}</CardTitle>
              {client.description && (
                <CardDescription className="mt-1">{client.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={client.isActive ? "default" : "secondary"}>
                {client.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">
                {client.isConfidential ? "Confidential" : "Public"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client ID */}
          <div className="space-y-2">
            <Label>Client ID</Label>
            <div className="flex gap-2">
              <Input value={client.clientId} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(client.clientId, "clientId")}
                title="Copy Client ID"
              >
                {copiedField === "clientId" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label>Client Secret</Label>
            <div className="flex gap-2">
              <Input value="••••••••••••••••••••••••••••••••" readOnly className="font-mono" />
              {onRegenerateSecret && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowRegenerateConfirm(true)}
                  title="Regenerate Secret"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Regenerating will invalidate the current secret and all existing tokens.
            </p>
          </div>

          <Separator />

          {/* Redirect URIs */}
          <div className="space-y-2">
            <Label>Redirect URIs</Label>
            <ul className="space-y-1">
              {client.redirectUris.map((uri, index) => (
                <li key={index} className="flex items-center gap-2 text-sm font-mono">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  {uri}
                </li>
              ))}
            </ul>
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label>Allowed Scopes</Label>
            <div className="flex flex-wrap gap-2">
              {client.allowedScopes.map((scope) => (
                <Badge key={scope} variant="secondary">
                  {OAUTH_SCOPE_DISPLAY[scope]?.name || scope}
                </Badge>
              ))}
            </div>
          </div>

          {/* Grant Types */}
          <div className="space-y-2">
            <Label>Grant Types</Label>
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
            <span>Created: {createdDate}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onEdit && (
              <Button variant="outline" onClick={onEdit} disabled={isLoading}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete OAuth Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{client.name}" and revoke all access tokens.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Client Secret?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new client secret and invalidate the old one.
              All existing tokens will be revoked. You will need to update your application
              with the new secret.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateSecret} disabled={isRegenerating}>
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
